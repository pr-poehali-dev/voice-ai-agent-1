import json
import requests
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Proxy requests to Ecomkassa API to avoid CORS issues
    Args: event with httpMethod, body (login, password, endpoint)
    Returns: HTTP response with data from Ecomkassa API
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_str = event.get('body', '')
    if not body_str:
        body_data = {}
    else:
        body_data = json.loads(body_str) if isinstance(body_str, str) else body_str
    login = body_data.get('login', '')
    password = body_data.get('password', '')
    endpoint = body_data.get('endpoint', '/api/mobile/v1/profile/firm')
    
    if not login or not password:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Login and password required'})
        }
    
    try:
        url = f'https://api.ecomkassa.ru{endpoint}'
        auth = (login, password)
        
        response = requests.get(url, auth=auth, timeout=10, verify=False)
        
        return {
            'statusCode': response.status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': response.text
        }
    except requests.RequestException as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Request failed: {str(e)}'})
        }