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
    
    if not user_message:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Message is required'})
        }
    
    if not operation_type:
        operation_type = detect_operation_type(user_message)
    
    parsed_receipt = parse_receipt_from_text(user_message, settings)
    
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
    
    login = os.environ.get('ECOMKASSA_LOGIN', '')
    password = os.environ.get('ECOMKASSA_PASSWORD', '')
    group_code = os.environ.get('ECOMKASSA_GROUP_CODE', '')
    
    external_id = f'receipt_{abs(hash(user_message + str(parsed_receipt)))}'
    
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
        receipt_result.get('demo', False)
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
    auth_url = 'https://app.ecomkassa.ru/api/v2/auth/login'
    
    payload = {
        'login': login,
        'password': password
    }
    
    try:
        req = urllib.request.Request(
            auth_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            return response_data.get('token')
    
    except Exception:
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
    
    auth_key = settings.get('gigachat_auth_key') or os.environ.get('GIGACHAT_AUTH_KEY', '')
    
    if not auth_key:
        return fallback_parse_receipt(text, settings)
    
    access_token = get_gigachat_token(auth_key)
    
    if not access_token:
        return fallback_parse_receipt(text, settings)
    
    prompt = f"""Извлеки из текста данные для чека и верни ТОЛЬКО валидный JSON без дополнительного текста.

Текст клиента: "{text}"

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ, которые должны быть в тексте:
1. Email клиента (обязательно)
2. Название товара/услуги (обязательно)
3. Цена товара/услуги (обязательно)

Если любое из этих полей отсутствует, верни JSON с полем "error" и описанием чего не хватает.

Верни JSON в формате:
{{
  "items": [
    {{
      "name": "Название товара",
      "price": 100.00,
      "quantity": 1,
      "measure": "шт",
      "vat": "none",
      "payment_method": "full_payment",
      "payment_object": "commodity"
    }}
  ],
  "client": {{
    "email": "email@example.com",
    "phone": "+79991234567"
  }},
  "payment_type": "electronically"
}}

Правила определения полей:
- payment_object: Определи автоматически из названия товара:
  * "commodity" - физические товары (круассан, кофе, книга, телефон)
  * "service" - услуги (консультация, стрижка, доставка, ремонт)
  * "work" - выполнение работ (монтаж, установка, строительство)
- payment_method: всегда "full_payment" (полная оплата)
- payment_type: "cash" если явно указано "наличными", иначе "electronically"
- measure: "шт" для товаров, "услуга" для услуг, "работа" для работ
- vat: "none" по умолчанию
- quantity: 1 если не указано иначе
- Если телефон не указан, оставь null
- ВАЖНО: Цена обязательна. Если не указана - верни ошибку
"""
    
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
        response = requests.post(chat_url, headers=headers, json=payload, verify=False, timeout=20)
        result = response.json()
        
        ai_response = result.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        print(f"[DEBUG] GigaChat response: {ai_response}")
        
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            parsed_data = json.loads(json_match.group(0))
            
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
            
            if not client_email or client_email == 'customer@example.com':
                client_email = settings.get('company_email', 'customer@example.com')
            
            items = parsed_data.get('items', [])
            default_vat = settings.get('default_vat', 'none')
            for item in items:
                if 'vat' not in item or item['vat'] == 'none':
                    item['vat'] = default_vat
            
            total = sum(item.get('price', 0) * item.get('quantity', 1) for item in items)
            
            return {
                'items': items,
                'total': round(total, 2),
                'payments': [{
                    'type': parsed_data.get('payment_type', 'electronically'),
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
        
        print(f"[DEBUG] No JSON found in response, using fallback")
        return fallback_parse_receipt(text, settings)
        
    except Exception as e:
        print(f"[DEBUG] Exception: {str(e)}")
        return fallback_parse_receipt(text, settings)


def fallback_parse_receipt(text: str, settings: dict = None) -> Dict[str, Any]:
    import re
    
    if settings is None:
        settings = {}
    
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    customer_email = email_match.group(0) if email_match else settings.get('company_email', 'customer@example.com')
    
    phone_match = re.search(r'\+?[78][\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}', text)
    customer_phone = phone_match.group(0) if phone_match else None
    
    price_matches = re.findall(r'(\d+)\s*(?:руб|₽|рублей)', text.lower())
    
    items = []
    total = 0
    
    default_vat = settings.get('default_vat', 'none')
    
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
    
    payment_type = 'electronically'
    if 'налич' in text.lower() or 'наличные' in text.lower():
        payment_type = 'cash'
    
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
    
    ecomkassa_payload = {
        'external_id': f'receipt_{abs(hash(str(receipt_data)))}',
        'print': True,
        'client': {
            'email': receipt_data.get('customer_email', '')
        },
        'company': {
            'payment_address': 'example.com'
        },
        'items': [
            {
                'type': 'position',
                'name': item['name'],
                'price': item['price'],
                'quantity': item.get('quantity', 1),
                'amount': round(item['price'] * item.get('quantity', 1), 2),
                'measure': 'piece',
                'payment_method': 'full_payment',
                'vat': 'none'
            }
            for item in receipt_data['items']
        ],
        'payments': [
            {
                'type': 'card' if receipt_data.get('payment_type') == 'card' else 'cash',
                'amount': receipt_data['total']
            }
        ],
        'total': receipt_data['total']
    }
    
    try:
        req = urllib.request.Request(
            api_url,
            data=json.dumps(ecomkassa_payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=15) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            
            return {
                'success': True,
                'message': 'Чек успешно создан в екомкасса',
                'receipt': receipt_data,
                'ecomkassa_response': response_data,
                'operation_type': operation_type
            }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
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
    demo_mode: bool
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
            'payment_type, customer_email, ecomkassa_response, status, demo_mode) '
            'VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) '
            'ON CONFLICT (external_id) DO UPDATE SET '
            'ecomkassa_response = EXCLUDED.ecomkassa_response, '
            'status = EXCLUDED.status, '
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
                demo_mode
            )
        )
        
        conn.commit()
        cursor.close()
        conn.close()
    
    except Exception:
        pass