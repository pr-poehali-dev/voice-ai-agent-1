import json
import requests
import urllib3
from typing import Dict, Any

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


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
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_str = event.get('body', '')
    if not body_str:
        body_data = {}
    else:
        try:
            body_data = json.loads(body_str) if isinstance(body_str, str) else body_str
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid JSON'}),
                'isBase64Encoded': False
            }
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
            'body': json.dumps({'error': 'Login and password required'}),
            'isBase64Encoded': False
        }
    
    try:
        url = f'https://app.ecomkassa.ru{endpoint}'
        auth = (login, password)
        
        print(f"Requesting: {url}")
        response = requests.get(url, auth=auth, timeout=10, verify=False)
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
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
            'body': json.dumps({'error': f'Request failed: {str(e)}'}),
            'isBase64Encoded': False
        }