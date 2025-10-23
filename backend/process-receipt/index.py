import json
import os
import urllib.request
import urllib.error
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
    operation_type: str = body_data.get('operation_type', 'sell')
    
    if not user_message:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Message is required'})
        }
    
    parsed_receipt = parse_receipt_from_text(user_message)
    
    login = os.environ.get('ECOMKASSA_LOGIN', '')
    password = os.environ.get('ECOMKASSA_PASSWORD', '')
    group_code = os.environ.get('ECOMKASSA_GROUP_CODE', '')
    
    external_id = f'receipt_{abs(hash(user_message + str(parsed_receipt)))}'
    
    if not (login and password and group_code):
        demo_result = {
            'success': True,
            'message': 'Чек обработан (демо-режим без учетных данных)',
            'receipt': parsed_receipt,
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


def parse_receipt_from_text(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    
    items = []
    total = 0
    
    if 'хлеб' in text_lower or 'булка' in text_lower:
        items.append({'name': 'Хлеб', 'price': 50.00, 'quantity': 1})
        total += 50.00
    
    if 'молоко' in text_lower:
        items.append({'name': 'Молоко', 'price': 80.00, 'quantity': 1})
        total += 80.00
    
    if 'яблок' in text_lower or 'яблоко' in text_lower:
        items.append({'name': 'Яблоки', 'price': 120.00, 'quantity': 1})
        total += 120.00
    
    if 'кофе' in text_lower:
        items.append({'name': 'Кофе', 'price': 350.00, 'quantity': 1})
        total += 350.00
    
    if 'сыр' in text_lower:
        items.append({'name': 'Сыр', 'price': 450.00, 'quantity': 1})
        total += 450.00
    
    import re
    price_matches = re.findall(r'(\d+)\s*(?:руб|₽|рублей)', text_lower)
    if price_matches and not items:
        for price_str in price_matches:
            price_val = float(price_str)
            items.append({'name': 'Товар', 'price': price_val, 'quantity': 1})
            total += price_val
    
    if not items:
        items.append({'name': 'Товар по умолчанию', 'price': 100.00, 'quantity': 1})
        total = 100.00
    
    return {
        'items': items,
        'total': round(total, 2),
        'payment_type': 'card',
        'customer_email': 'customer@example.com'
    }


def create_ecomkassa_receipt(
    receipt_data: Dict[str, Any], 
    token: str,
    group_code: str,
    operation_type: str = 'sell'
) -> Dict[str, Any]:
    
    valid_operations = {
        'sell', 'sell_refund', 'buy', 'buy_refund',
        'sell_correction', 'buy_correction',
        'sell_refund_correction', 'buy_refund_correction'
    }
    
    if operation_type not in valid_operations:
        operation_type = 'sell'
    
    api_url = f'https://app.ecomkassa.ru/fiscalorder/v5/{group_code}/{operation_type}'
    
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