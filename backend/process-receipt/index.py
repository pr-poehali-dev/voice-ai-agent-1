import json
import os
import urllib.request
import urllib.error
import uuid
from typing import Dict, Any, Optional

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Process natural language receipt requests and create receipt via ecomkassa API
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with attributes: request_id, function_name
    Returns: HTTP response dict with receipt data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    user_message: str = body_data.get('message', '')
    operation_type: str = body_data.get('operation_type', '')
    preview_only: bool = body_data.get('preview_only', False)
    settings: dict = body_data.get('settings', {})
    previous_receipt: dict = body_data.get('previous_receipt', {})
    edited_data: dict = body_data.get('edited_data')
    
    if not user_message:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Message is required'})
        }
    
    import re
    text_lower = user_message.lower().strip()
    
    irrelevant_keywords = [
        'привет', 'здравствуй', 'добрый', 'доброе', 'hello', 'hi', 'hey',
        'расскажи', 'что такое', 'как дела', 'анекдот', 'пошути', 
        'кто ты', 'спасибо', 'благодарю', 'помоги', 'помощь',
        'шутка', 'история', 'сказка', 'стих', 'стоп', 'хватит', 'стой',
        'привет', 'пока', 'досвидания', 'хай', 'хелло'
    ]
    
    has_receipt_keywords = any(keyword in text_lower for keyword in [
        'чек', 'товар', 'услуга', 'продаж', 'возврат', 'корр', 
        'руб', '₽', 'email', '@', 'цена', 'сумма', 'отправ', 'созда'
    ])
    
    if not has_receipt_keywords:
        for keyword in irrelevant_keywords:
            if keyword in text_lower:
                print(f"[DEBUG] Irrelevant request blocked: '{user_message}' contains '{keyword}'")
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': '❌ Я ИИ-кассир и помогаю только с созданием чеков. Укажи товар/услугу, цену и email клиента для создания чека.'
                    })
                }
        
        if len(text_lower) < 10:
            print(f"[DEBUG] Too short message without receipt keywords: '{user_message}'")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': '❌ Я ИИ-кассир и помогаю только с созданием чеков. Укажи товар/услугу, цену и email клиента для создания чека.'
                })
            }
    
    has_ecomkassa = (settings.get('ecomkassa_login') or settings.get('username')) and \
                    (settings.get('ecomkassa_password') or settings.get('password')) and \
                    settings.get('group_code')
    has_gigachat = settings.get('gigachat_auth_key')
    
    if not has_ecomkassa and not preview_only:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Настройки ЕкомКасса не заполнены',
                'message': 'Перейди в Настройки и заполни: логин, пароль и код группы касс ЕкомКасса',
                'missing_integration': 'ecomkassa'
            })
        }
    
    if not has_gigachat and not preview_only:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Настройки GigaChat не заполнены',
                'message': 'Перейди в Настройки и заполни ключ авторизации GigaChat для распознавания запросов',
                'missing_integration': 'gigachat'
            })
        }
    
    repeat_uuid = detect_repeat_command(user_message)
    
    if not operation_type:
        operation_type = detect_operation_type(user_message)
    
    if edited_data:
        print(f"[DEBUG] Using edited_data: {edited_data}")
        parsed_receipt = edited_data
    elif repeat_uuid == 'LAST':
        existing_receipt = get_last_receipt_from_db()
        if existing_receipt:
            parsed_receipt = {
                'items': existing_receipt['items'],
                'total': existing_receipt['total'],
                'payment_type': existing_receipt.get('payment_type', 'card'),
                'client': {
                    'email': existing_receipt.get('customer_email', '')
                },
                'company': settings
            }
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'message': f'Повторяю последний чек',
                    'receipt': parsed_receipt,
                    'operation_type': operation_type,
                    'preview': True,
                    'is_repeat': True
                })
            }
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'В истории нет чеков для повтора'
                })
            }
    elif repeat_uuid:
        existing_receipt = get_receipt_from_db(repeat_uuid)
        if existing_receipt:
            parsed_receipt = existing_receipt
            operation_type = existing_receipt.get('operation_type', 'sell')
            
            if 'company' not in parsed_receipt:
                parsed_receipt['company'] = {}
            
            parsed_receipt['company']['email'] = settings.get('company_email', parsed_receipt.get('company', {}).get('email', ''))
            parsed_receipt['company']['inn'] = settings.get('inn', parsed_receipt.get('company', {}).get('inn', ''))
            parsed_receipt['company']['sno'] = settings.get('sno', parsed_receipt.get('company', {}).get('sno', 'usn_income'))
            parsed_receipt['company']['payment_address'] = settings.get('payment_address', parsed_receipt.get('company', {}).get('payment_address', ''))
            
            if not parsed_receipt.get('client', {}).get('email'):
                company_email = settings.get('company_email', '')
                if company_email:
                    if 'client' not in parsed_receipt:
                        parsed_receipt['client'] = {}
                    parsed_receipt['client']['email'] = company_email
            
            if preview_only:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'message': f'Найден чек UUID {repeat_uuid}. Проверь данные перед повторной отправкой. При отправке будет создан новый external_id.',
                        'receipt': parsed_receipt,
                        'operation_type': operation_type,
                        'preview': True,
                        'is_repeat': True
                    })
                }
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Чек с UUID {repeat_uuid} не найден в истории'
                })
            }
    else:
        try:
            parsed_receipt = parse_receipt_from_text(user_message, settings)
        except ValueError as e:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': str(e),
                    'message': str(e)
                })
            }
        
        if previous_receipt:
            parsed_receipt = merge_receipts(previous_receipt, parsed_receipt)
    
    if preview_only:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Предпросмотр чека',
                'receipt': parsed_receipt,
                'operation_type': operation_type,
                'preview': True
            })
        }
    
    client_email = parsed_receipt.get('client', {}).get('email', '')
    
    invalid_emails = ['customer@example.com', 'НЕ УКАЗАН email', 'email@example.com', '']
    if not client_email or client_email in invalid_emails or '@' not in client_email or '.' not in client_email:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Не указан email клиента',
                'message': 'Укажи email клиента в сообщении или добавь company_email в настройках',
                'missing_field': 'email'
            })
        }
    
    login = settings.get('ecomkassa_login') or os.environ.get('ECOMKASSA_LOGIN', '')
    password = settings.get('ecomkassa_password') or os.environ.get('ECOMKASSA_PASSWORD', '')
    group_code = settings.get('group_code') or os.environ.get('ECOMKASSA_GROUP_CODE', '')
    
    external_id = f'AI_{abs(hash(user_message + str(parsed_receipt)))}'
    
    if not (login and password and group_code):
        demo_result = {
            'success': True,
            'message': 'Чек обработан (демо-режим без учетных данных)',
            'receipt': parsed_receipt,
            'operation_type': operation_type,
            'demo': True
        }
        save_receipt_to_db(external_id, user_message, parsed_receipt, operation_type, None, True)
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(demo_result)
        }
    
    token = get_ecomkassa_token(login, password)
    
    if not token:
        error_result = {
            'success': False,
            'message': 'Не удалось авторизоваться в екомкасса',
            'receipt': parsed_receipt,
            'operation_type': operation_type,
            'demo': True
        }
        save_receipt_to_db(external_id, user_message, parsed_receipt, operation_type, None, True)
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(error_result)
        }
    
    receipt_result = create_ecomkassa_receipt(
        parsed_receipt, 
        token, 
        group_code,
        operation_type
    )
    
    save_receipt_to_db(
        external_id,
        user_message,
        parsed_receipt,
        operation_type,
        receipt_result.get('ecomkassa_response'),
        receipt_result.get('demo', False),
        receipt_result.get('uuid')
    )
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(receipt_result)
    }


def get_ecomkassa_token(login: str, password: str) -> Optional[str]:
    auth_url = 'https://app.ecomkassa.ru/fiscalorder/v5/getToken'
    
    payload = {
        'login': login,
        'pass': password
    }
    
    try:
        req = urllib.request.Request(
            auth_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json; charset=utf-8'},
            method='POST'
        )
        
        print(f"[DEBUG] Getting token for login: {login[:3]}***")
        with urllib.request.urlopen(req, timeout=10) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            print(f"[DEBUG] Token response code: {response_data.get('code')}")
            if response_data.get('code') == 0:
                token = response_data.get('token')
                print(f"[DEBUG] Token received: {token[:50] if token else 'None'}...")
                return token
            else:
                print(f"[DEBUG] Token error: {response_data.get('text')}")
                return None
    
    except Exception as e:
        print(f"[DEBUG] Exception getting token: {str(e)}")
        return None


def merge_receipts(previous: dict, new: dict) -> dict:
    result = previous.copy()
    
    if new.get('client', {}).get('email') and new['client']['email'] != 'customer@example.com':
        if 'client' not in result:
            result['client'] = {}
        result['client']['email'] = new['client']['email']
    
    if new.get('items') and len(new['items']) > 0:
        first_item = new['items'][0]
        if first_item.get('name') != 'Товар/Услуга':
            result['items'] = new['items']
            result['total'] = new.get('total', result.get('total', 0))
    
    if new.get('company'):
        if 'company' not in result:
            result['company'] = {}
        for key, value in new['company'].items():
            if value and value not in ['example@company.ru', 'None', '']:
                result['company'][key] = value
    
    return result


def detect_repeat_command(text: str) -> Optional[str]:
    import re
    text_lower = text.lower()
    
    repeat_with_uuid_patterns = [
        r'повтор[иь]\s+чек\s+№?\s*([a-zA-Z0-9_-]+)',
        r'повтор[иь]\s+№?\s*([a-zA-Z0-9_-]+)',
        r'отправ[иь]\s+снова\s+№?\s*([a-zA-Z0-9_-]+)',
        r'пересоздай\s+чек\s+№?\s*([a-zA-Z0-9_-]+)',
        r'создай\s+заново\s+№?\s*([a-zA-Z0-9_-]+)'
    ]
    
    for pattern in repeat_with_uuid_patterns:
        match = re.search(pattern, text_lower)
        if match:
            return match.group(1)
    
    repeat_without_uuid_patterns = [
        r'повтор[иь]\s+чек',
        r'повтор[иь]\s+последний',
        r'отправ[иь]\s+снова',
        r'пересоздай\s+чек',
        r'создай\s+заново'
    ]
    
    for pattern in repeat_without_uuid_patterns:
        if re.search(pattern, text_lower):
            return 'LAST'
    
    return None


def get_receipt_from_db(uuid_search: str) -> Optional[Dict[str, Any]]:
    database_url = os.environ.get('DATABASE_URL', '')
    if not database_url:
        return None
    
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            "SELECT external_id, user_message, operation_type, items, total, "
            "payment_type, customer_email, ecomkassa_response FROM t_p7891941_voice_ai_agent_1.receipts "
            "WHERE ecomkassa_response->>'uuid' = %s LIMIT 1",
            (uuid_search,)
        )
        
        receipt = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if receipt:
            return {
                'original_external_id': receipt['external_id'],
                'user_message': receipt['user_message'],
                'operation_type': receipt['operation_type'],
                'items': receipt['items'],
                'total': float(receipt['total']),
                'payment_type': receipt['payment_type'],
                'client': {
                    'email': receipt['customer_email']
                },
                'payments': [{
                    'type': '0' if receipt['payment_type'] == 'cash' else '1',
                    'sum': float(receipt['total'])
                }]
            }
        
        return None
    except Exception as e:
        print(f"[DEBUG] Error getting receipt from DB: {str(e)}")
        return None


def get_last_receipt_from_db() -> Optional[Dict[str, Any]]:
    database_url = os.environ.get('DATABASE_URL', '')
    if not database_url:
        return None
    
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            "SELECT external_id, user_message, operation_type, items, total, "
            "payment_type, customer_email, ecomkassa_response "
            "FROM t_p7891941_voice_ai_agent_1.receipts "
            "WHERE status = 'success' AND demo_mode = false "
            "ORDER BY created_at DESC LIMIT 1"
        )
        
        receipt = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if receipt:
            return {
                'original_external_id': receipt['external_id'],
                'user_message': receipt['user_message'],
                'operation_type': receipt['operation_type'],
                'items': receipt['items'],
                'total': float(receipt['total']),
                'payment_type': receipt['payment_type'],
                'customer_email': receipt['customer_email']
            }
        
        return None
    except Exception as e:
        print(f"[DEBUG] Error getting last receipt from DB: {str(e)}")
        return None


def detect_operation_type(text: str) -> str:
    text_lower = text.lower()
    
    refund_keywords = [
        'возврат', 'верни', 'вернуть', 'refund', 'отмен',
        'верну', 'возвращ', 'отказ'
    ]
    
    correction_keywords = [
        'коррекция', 'исправ', 'корректир', 'ошибк'
    ]
    
    refund_correction_keywords = [
        'коррекция расход', 'исправить расход', 'под отчет'
    ]
    
    sell_correction_keywords = [
        'коррекция прихода', 'исправить приход', 'коррекция продаж'
    ]
    
    for keyword in refund_correction_keywords:
        if keyword in text_lower:
            return 'refund_correction'
    
    for keyword in sell_correction_keywords:
        if keyword in text_lower:
            return 'sell_correction'
    
    for keyword in refund_keywords:
        if keyword in text_lower:
            return 'refund'
    
    for keyword in correction_keywords:
        if keyword in text_lower:
            return 'sell_correction'
    
    return 'sell'


def get_gigachat_token(auth_key: str) -> Optional[str]:
    import requests
    
    token_url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
    
    headers = {
        'Authorization': f'Basic {auth_key}',
        'RqUID': str(uuid.uuid4()),
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    data = {
        'scope': 'GIGACHAT_API_PERS'
    }
    
    try:
        response = requests.post(token_url, headers=headers, data=data, verify=False, timeout=10)
        response_data = response.json()
        return response_data.get('access_token')
    except Exception as e:
        return None


def parse_receipt_from_text(text: str, settings: dict = None) -> Dict[str, Any]:
    import re
    import requests
    import uuid
    
    if settings is None:
        settings = {}
    
    text_lower = text.lower().strip()
    greeting_patterns = [
        r'^привет',
        r'^здравствуй',
        r'^добр[ыо]',
        r'^hello',
        r'^hi\b',
        r'^hey\b',
        r'^расскажи',
        r'^что такое',
        r'^как дела',
        r'^анекдот',
        r'^пошути',
        r'^кто ты',
        r'^помоги',
        r'^спасибо'
    ]
    
    for pattern in greeting_patterns:
        if re.match(pattern, text_lower):
            raise ValueError(
                'Я ИИ-кассир и помогаю только с созданием чеков. '
                'Укажи товар/услугу, цену и email клиента для создания чека.'
            )
    
    auth_key = settings.get('gigachat_auth_key') or os.environ.get('GIGACHAT_AUTH_KEY', '')
    
    if not auth_key:
        return fallback_parse_receipt(text, settings)
    
    access_token = get_gigachat_token(auth_key)
    
    if not access_token:
        return fallback_parse_receipt(text, settings)
    
    prompt = f"""Парсер чеков. Извлеки данные из запроса и верни JSON.

Запрос: "{text}"

Правила:
- Убери команды: создай, пробей, сделай, на, для, чек
- Примеры: "чек кофе 200р" → "Кофе", "стрижка 1500" → "Стрижка"
- operation_type: sell (продажа), sell_refund (возврат), sell_correction (коррекция)
- payment_type: cash (наличные) или electronically (безнал, по умолчанию)
- payment_object: commodity (товар) или service (услуга)
- vat: none (по умолчанию), vat20, vat10
- measure: шт (товар), услуга (услуга)

JSON формат:
{{
  "operation_type": "sell",
  "items": [{{"name": "Товар", "price": 100, "quantity": 1, "measure": "шт", "vat": "none", "payment_method": "full_payment", "payment_object": "commodity"}}],
  "client": {{"email": "email@example.com", "phone": null}},
  "payment_type": "electronically"
}}

Если не хватает данных:
{{"error": "Недостаточно данных", "missing": ["email"]}}

Ответ (только JSON):"""
    
    chat_url = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions'
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'model': 'GigaChat',
        'messages': [
            {
                'role': 'user',
                'content': prompt
            }
        ],
        'temperature': 0.1,
        'max_tokens': 1000
    }
    
    try:
        timeout = 8
        print(f"[DEBUG] === GigaChat Request ===")
        print(f"[DEBUG] User message: {text[:100]}")
        print(f"[DEBUG] Prompt length: {len(prompt)} chars")
        print(f"[DEBUG] Timeout: {timeout}s")
        
        response = requests.post(chat_url, headers=headers, json=payload, verify=False, timeout=timeout)
        result = response.json()
        
        ai_response = result.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        print(f"[DEBUG] === GigaChat Response ===")
        print(f"[DEBUG] Response: {ai_response[:200]}")
        
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group(0).replace('\n', ' ').replace('\r', ' ')
            parsed_data = json.loads(json_str)
            
            print(f"[DEBUG] Parsed data: {parsed_data}")
            
            if 'error' in parsed_data:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': parsed_data['error'],
                        'message': 'Не хватает обязательных данных для создания чека'
                    })
                }
            
            client_data = parsed_data.get('client', {})
            client_email = client_data.get('email', '')
            
            items = parsed_data.get('items', [])
            default_vat = settings.get('default_vat', 'none')
            for item in items:
                if 'vat' not in item or item['vat'] == 'none':
                    item['vat'] = default_vat
            
            total = sum(item.get('price', 0) * item.get('quantity', 1) for item in items)
            
            payment_type_raw = parsed_data.get('payment_type', 'electronically')
            payment_type_map = {
                'cash': '0',
                'electronically': '1',
                'prepaid': '2',
                'credit': '3',
                'other': '4'
            }
            payment_type = payment_type_map.get(payment_type_raw, '1')
            
            return {
                'items': items,
                'total': round(total, 2),
                'payments': [{
                    'type': payment_type,
                    'sum': round(total, 2)
                }],
                'client': {'email': client_email, 'phone': client_data.get('phone')},
                'company': {
                    'email': settings.get('company_email', 'company@example.com'),
                    'sno': settings.get('sno', 'usn_income'),
                    'inn': settings.get('inn', '1234567890'),
                    'payment_address': settings.get('payment_address', 'example.com')
                }
            }
        
        print(f"[WARN] No JSON found in GigaChat response, using fallback")
                
    except Exception as e:
        print(f"[WARN] GigaChat failed ({str(e)}), using fallback")
    
    print(f"[INFO] Using fallback parser")
    return fallback_parse_receipt(text, settings)


def fallback_parse_receipt(text: str, settings: dict = None) -> Dict[str, Any]:
    import re
    
    if settings is None:
        settings = {}
    
    text_lower = text.lower().strip()
    greeting_patterns = [
        r'^привет',
        r'^здравствуй',
        r'^добр[ыо]',
        r'^hello',
        r'^hi\b',
        r'^hey\b',
        r'^расскажи',
        r'^что такое',
        r'^как дела',
        r'^анекдот',
        r'^пошути'
    ]
    
    for pattern in greeting_patterns:
        if re.match(pattern, text_lower):
            raise ValueError(
                'Я ИИ-кассир и помогаю только с созданием чеков. '
                'Укажи товар/услугу, цену и email клиента для создания чека.'
            )
    
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    customer_email = email_match.group(0) if email_match else settings.get('company_email', '')
    
    phone_match = re.search(r'\+?[78][\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}', text)
    customer_phone = phone_match.group(0) if phone_match else None
    
    text_clean = text.lower()
    skip_words = ['чек', 'создай', 'создать', 'сделай', 'сделать', 'оформи', 'оформить', 'пробей', 'отправь', 'для', 'на']
    for word in skip_words:
        text_clean = re.sub(r'\b' + word + r'\b', '', text_clean)
    
    text_clean = re.sub(r'\b(продажу|продаже|возврат|коррекция|коррекцию)\b', '', text_clean)
    
    item_patterns = re.findall(r'([а-яА-ЯёЁa-zA-Z]+(?:\s+[а-яА-ЯёЁa-zA-Z]+)*?)\s+(\d+)\s*(?:руб|₽|рублей)?', text_clean, re.IGNORECASE)
    
    items = []
    total = 0
    
    default_vat = settings.get('default_vat', 'none')
    
    service_keywords = [
        'консультация', 'стрижка', 'доставка', 'ремонт', 'услуга',
        'обучение', 'тренинг', 'коучинг', 'массаж', 'сервис',
        'поддержка', 'настройка', 'установка', 'монтаж'
    ]
    
    if item_patterns:
        for item_name_raw, price_str in item_patterns:
            item_name = item_name_raw.strip()
            price_val = float(price_str)
            
            item_lower = item_name.lower()
            payment_object = 'service' if any(kw in item_lower for kw in service_keywords) else 'commodity'
            
            items.append({
                'name': item_name.capitalize(), 
                'price': price_val, 
                'quantity': 1,
                'measure': 'шт',
                'vat': default_vat,
                'payment_method': 'full_payment',
                'payment_object': payment_object
            })
            total += price_val
    else:
        # Fallback: ищем просто цену
        price_matches = re.findall(r'(\d+)\s*(?:руб|₽|рублей)', text.lower())
        
        if price_matches:
            for price_str in price_matches:
                price_val = float(price_str)
                items.append({
                    'name': 'Товар', 
                    'price': price_val, 
                    'quantity': 1,
                    'measure': 'шт',
                    'vat': default_vat,
                    'payment_method': 'full_payment',
                    'payment_object': 'commodity'
                })
                total += price_val
    
    if not items:
        items.append({
            'name': 'Товар', 
            'price': 100.00, 
            'quantity': 1,
            'measure': 'шт',
            'vat': default_vat,
            'payment_method': 'full_payment',
            'payment_object': 'commodity'
        })
        total = 100.00
    
    payment_type_raw = 'electronically'
    if 'налич' in text.lower() or 'наличные' in text.lower():
        payment_type_raw = 'cash'
    
    payment_type_map = {
        'cash': '0',
        'electronically': '1'
    }
    payment_type = payment_type_map.get(payment_type_raw, '1')
    
    return {
        'items': items,
        'total': round(total, 2),
        'payments': [{
            'type': payment_type,
            'sum': round(total, 2)
        }],
        'client': {
            'email': customer_email,
            'phone': customer_phone
        },
        'company': {
            'email': settings.get('company_email', 'company@example.com'),
            'sno': settings.get('sno', 'usn_income'),
            'inn': settings.get('inn', '1234567890'),
            'payment_address': settings.get('payment_address', 'example.com')
        }
    }


def create_ecomkassa_receipt(
    receipt_data: Dict[str, Any], 
    token: str,
    group_code: str,
    operation_type: str = 'sell'
) -> Dict[str, Any]:
    
    operation_mapping = {
        'sell': 'sell',
        'refund': 'sell_refund',
        'sell_correction': 'sell_correction',
        'refund_correction': 'buy_refund_correction'
    }
    
    api_operation_type = operation_mapping.get(operation_type, 'sell')
    
    api_url = f'https://app.ecomkassa.ru/fiscalorder/v5/{group_code}/{api_operation_type}'
    
    from datetime import datetime
    import time
    
    client_data = receipt_data.get('client', {})
    company_data = receipt_data.get('company', {})
    
    measure_map = {
        'шт': '0',
        'г': '10',
        'кг': '11',
        'т': '12',
        'см': '13',
        'м': '14',
        'км': '15',
        'кв.м': '16',
        'куб.м': '17',
        'л': '18',
        'час': '19',
        'мин': '20',
        'сек': '21',
        'кВт⋅ч': '22',
        'Гкал': '23',
        'сутки': '24'
    }
    
    items_for_payload = [
        {
            'name': item['name'],
            'price': float(item['price']),
            'quantity': float(item.get('quantity', 1)),
            'sum': round(float(item['price']) * float(item.get('quantity', 1)), 2),
            'measure': int(measure_map.get(item.get('measure', 'шт'), '0')),
            'payment_method': item.get('payment_method', 'full_payment'),
            'payment_object': {
                'commodity': 1,
                'excise': 2,
                'job': 3,
                'service': 4
            }.get(item.get('payment_object'), 4),
            'vat': {
                'type': item.get('vat', 'none')
            }
        }
        for item in receipt_data['items']
    ]
    
    calculated_total = round(sum(item['sum'] for item in items_for_payload), 2)
    
    unique_id = f'AI_{int(time.time() * 1000000)}'
    
    ecomkassa_payload = {
        'external_id': unique_id,
        'timestamp': datetime.now().strftime('%d.%m.%Y %H:%M:%S'),
        'receipt': {
            'client': {
                'email': client_data.get('email', '')
            },
            'company': {
                'email': company_data.get('email', ''),
                'sno': company_data.get('sno', 'usn_income'),
                'inn': company_data.get('inn', ''),
                'payment_address': company_data.get('payment_address', '')
            },
            'items': items_for_payload,
            'payments': [
                {
                    'type': int(payment.get('type', 1)) if isinstance(payment.get('type'), str) and payment.get('type').isdigit() else 1,
                    'sum': calculated_total
                }
                for payment in receipt_data.get('payments', [{'type': 1, 'sum': calculated_total}])
            ],
            'total': calculated_total
        }
    }
    
    print(f"[DEBUG] Sending to ecomkassa: {api_url}")
    print(f"[DEBUG] Payload: {json.dumps(ecomkassa_payload, ensure_ascii=False, indent=2)}")
    
    try:
        req = urllib.request.Request(
            api_url,
            data=json.dumps(ecomkassa_payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Token': token
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=15) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            print(f"[DEBUG] Ecomkassa success response: {json.dumps(response_data, ensure_ascii=False)}")
            
            uuid = response_data.get('uuid', '')
            permalink = response_data.get('permalink', '')
            
            return {
                'success': True,
                'message': 'Чек успешно создан в екомкасса',
                'uuid': uuid,
                'permalink': permalink,
                'receipt': receipt_data,
                'ecomkassa_response': response_data,
                'operation_type': operation_type
            }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"[DEBUG] Ecomkassa HTTP error {e.code}: {error_body}")
        return {
            'success': False,
            'message': f'Ошибка API екомкасса: {e.code}',
            'receipt': receipt_data,
            'error': error_body,
            'demo': True
        }
    
    except Exception as e:
        return {
            'success': False,
            'message': f'Ошибка при создании чека: {str(e)}',
            'receipt': receipt_data,
            'demo': True
        }


def save_receipt_to_db(
    external_id: str,
    user_message: str,
    receipt_data: Dict[str, Any],
    operation_type: str,
    ecomkassa_response: Optional[Dict[str, Any]],
    demo_mode: bool,
    uuid: Optional[str] = None
) -> None:
    database_url = os.environ.get('DATABASE_URL', '')
    
    if not database_url:
        return
    
    import psycopg2
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        cursor.execute(
            'INSERT INTO receipts (external_id, user_message, operation_type, items, total, '
            'payment_type, customer_email, ecomkassa_response, status, demo_mode, uuid) '
            'VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) '
            'ON CONFLICT (external_id) DO UPDATE SET '
            'ecomkassa_response = EXCLUDED.ecomkassa_response, '
            'status = EXCLUDED.status, '
            'uuid = EXCLUDED.uuid, '
            'updated_at = CURRENT_TIMESTAMP',
            (
                external_id,
                user_message,
                operation_type,
                json.dumps(receipt_data['items']),
                receipt_data['total'],
                receipt_data.get('payment_type', 'card'),
                receipt_data.get('customer_email'),
                json.dumps(ecomkassa_response) if ecomkassa_response else None,
                'success' if not demo_mode else 'demo',
                demo_mode,
                uuid
            )
        )
        
        conn.commit()
        cursor.close()
        conn.close()
    
    except Exception:
        pass