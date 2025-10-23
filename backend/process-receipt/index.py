import json
import os
from typing import Dict, Any

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
    
    api_key = os.environ.get('ECOMKASSA_API_KEY', '')
    
    if not api_key:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': f'Чек обработан (демо-режим без API ключа)',
                'receipt': parsed_receipt,
                'demo': True
            })
        }
    
    receipt_result = create_ecomkassa_receipt(parsed_receipt, api_key)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps(receipt_result)
    }


def parse_receipt_from_text(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    
    items = []
    total = 0
    
    if 'хлеб' in text_lower or 'булка' in text_lower:
        items.append({'name': 'Хлеб', 'price': 50, 'quantity': 1})
        total += 50
    
    if 'молоко' in text_lower:
        items.append({'name': 'Молоко', 'price': 80, 'quantity': 1})
        total += 80
    
    if 'яблок' in text_lower or 'яблоко' in text_lower:
        items.append({'name': 'Яблоки', 'price': 120, 'quantity': 1})
        total += 120
    
    if 'кофе' in text_lower:
        items.append({'name': 'Кофе', 'price': 350, 'quantity': 1})
        total += 350
    
    if 'сыр' in text_lower:
        items.append({'name': 'Сыр', 'price': 450, 'quantity': 1})
        total += 450
    
    import re
    price_matches = re.findall(r'(\d+)\s*(?:руб|₽|рублей)', text_lower)
    if price_matches and not items:
        for price_str in price_matches:
            price_val = int(price_str)
            items.append({'name': 'Товар', 'price': price_val, 'quantity': 1})
            total += price_val
    
    if not items:
        items.append({'name': 'Товар по умолчанию', 'price': 100, 'quantity': 1})
        total = 100
    
    return {
        'items': items,
        'total': total,
        'payment_type': 'card',
        'customer_email': 'customer@example.com'
    }


def create_ecomkassa_receipt(receipt_data: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    import urllib.request
    import urllib.error
    
    api_url = 'https://api.ecomkassa.ru/v1/receipts'
    
    ecomkassa_payload = {
        'external_id': f'receipt_{id(receipt_data)}',
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
                'amount': item['price'] * item.get('quantity', 1),
                'vat': 'none'
            }
            for item in receipt_data['items']
        ],
        'payments': [
            {
                'type': 'card',
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
                'Authorization': f'Bearer {api_key}'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            
            return {
                'success': True,
                'message': 'Чек успешно создан в екомкасса',
                'receipt': receipt_data,
                'ecomkassa_response': response_data
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
