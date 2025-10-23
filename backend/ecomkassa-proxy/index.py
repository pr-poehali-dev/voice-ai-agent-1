import json
import requests
import urllib3
from typing import Dict, Any

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Proxy requests to Ecomkassa API with JWT token authentication
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
        token_url = 'https://app.ecomkassa.ru/fiscalorder/v5/getToken'
        token_payload = {
            'login': login,
            'pass': password
        }
        headers = {
            'Content-Type': 'application/json; charset=utf-8'
        }
        
        print(f"Getting token from: {token_url}")
        token_response = requests.post(
            token_url, 
            json=token_payload, 
            headers=headers,
            timeout=10, 
            verify=False
        )
        print(f"Token response status: {token_response.status_code}")
        print(f"Token response body: {token_response.text[:200]}")
        
        if token_response.status_code != 200:
            return {
                'statusCode': token_response.status_code,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': token_response.text,
                'isBase64Encoded': False
            }
        
        token_data = token_response.json()
        if token_data.get('code') != 0:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': token_data.get('text', 'Failed to get token')}),
                'isBase64Encoded': False
            }
        
        token = token_data.get('token')
        if not token:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'No token in response'}),
                'isBase64Encoded': False
            }
        
        url = f'https://app.ecomkassa.ru{endpoint}'
        api_headers = {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Auth-Token': token
        }
        
        print(f"Requesting: {url}")
        response = requests.get(url, headers=api_headers, timeout=10, verify=False)
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
