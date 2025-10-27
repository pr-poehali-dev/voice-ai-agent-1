import json
import os
import psycopg2
import requests
import uuid
from typing import Dict, Any

def validate_gigachat_key(auth_key: str) -> Dict[str, Any]:
    '''Validate GigaChat auth key by getting access token'''
    try:
        response = requests.post(
            'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
            headers={
                'Authorization': f'Basic {auth_key}',
                'RqUID': str(uuid.uuid4()),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data={'scope': 'GIGACHAT_API_PERS'},
            timeout=10,
            verify=False
        )
        
        if response.status_code == 200:
            return {'valid': True, 'message': 'GigaChat key is valid'}
        else:
            return {'valid': False, 'message': f'Invalid key: {response.status_code}'}
    except Exception as e:
        return {'valid': False, 'message': f'Validation error: {str(e)}'}

def validate_yandexgpt_key(api_key: str, folder_id: str) -> Dict[str, Any]:
    '''Validate YandexGPT API key with test completion request'''
    try:
        response = requests.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            headers={
                'Authorization': f'Api-Key {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'modelUri': f'gpt://{folder_id}/yandexgpt-lite/latest',
                'completionOptions': {
                    'stream': False,
                    'temperature': 0.1,
                    'maxTokens': 10
                },
                'messages': [
                    {'role': 'user', 'text': 'test'}
                ]
            },
            timeout=15
        )
        
        if response.status_code == 200:
            return {'valid': True, 'message': 'YandexGPT key is valid'}
        else:
            return {'valid': False, 'message': f'Invalid key: {response.status_code}'}
    except Exception as e:
        return {'valid': False, 'message': f'Validation error: {str(e)}'}

def validate_gptunnel_key(api_key: str, model: str) -> Dict[str, Any]:
    '''Validate GPTunnel API key with test completion request'''
    try:
        response = requests.post(
            'https://gptunnel.ru/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': model,
                'messages': [
                    {'role': 'user', 'content': 'test'}
                ],
                'max_tokens': 10
            },
            timeout=15
        )
        
        print(f"GPTunnel response status: {response.status_code}")
        print(f"GPTunnel response body: {response.text[:500]}")
        
        if response.status_code == 200:
            return {'valid': True, 'message': 'GPTunnel key is valid'}
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('error', {}).get('message', response.text[:200])
            except:
                error_msg = response.text[:200]
            return {'valid': False, 'message': f'Invalid key: {response.status_code} - {error_msg}'}
    except Exception as e:
        return {'valid': False, 'message': f'Validation error: {str(e)}'}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage AI provider settings with key validation (get providers, validate keys, set active provider)
    Args: event with httpMethod (GET/POST), headers with X-Admin-Token, body with provider_id
    Returns: Active provider info and available providers list with validation status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    admin_token = headers.get('x-admin-token') or headers.get('X-Admin-Token')
    
    if not admin_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    available_providers = [
        {
            'id': 'gigachat',
            'name': 'GigaChat (Сбер)',
            'description': 'Российская модель от Сбера',
            'secret_name': 'GIGACHAT_AUTH_KEY',
            'has_secret': bool(os.environ.get('GIGACHAT_AUTH_KEY'))
        },
        {
            'id': 'yandexgpt',
            'name': 'YandexGPT',
            'description': 'Российская модель от Яндекса',
            'secret_name': 'YANDEXGPT_API_KEY',
            'has_secret': bool(os.environ.get('YANDEXGPT_API_KEY')) and bool(os.environ.get('YANDEXGPT_FOLDER_ID'))
        },
        {
            'id': 'gptunnel_chatgpt',
            'name': 'ChatGPT (GPT Tunnel)',
            'description': 'GPT-4o через российский сервис',
            'secret_name': 'GPTUNNEL_API_KEY',
            'has_secret': bool(os.environ.get('GPTUNNEL_API_KEY'))
        },
        {
            'id': 'gptunnel_claude',
            'name': 'Claude 3.5 Sonnet (GPT Tunnel)',
            'description': 'Claude 3.5 через российский сервис',
            'secret_name': 'GPTUNNEL_API_KEY',
            'has_secret': bool(os.environ.get('GPTUNNEL_API_KEY'))
        }
    ]
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    if method == 'GET':
        cur.execute("SELECT active_provider FROM ai_settings ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        active_provider = row[0] if row else ''
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'active_provider': active_provider,
                'available_providers': available_providers
            })
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        provider_id: str = body_data.get('provider_id', '')
        
        if provider_id and provider_id not in [p['id'] for p in available_providers]:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid provider_id'})
            }
        
        provider = next((p for p in available_providers if p['id'] == provider_id), None)
        if provider_id and provider and not provider['has_secret']:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Secret {provider["secret_name"]} not configured'})
            }
        
        if not provider_id:
            validation_result = {'valid': True, 'message': 'Disabling provider'}
        elif provider_id == 'gigachat':
            auth_key = os.environ.get('GIGACHAT_AUTH_KEY', '')
            validation_result = validate_gigachat_key(auth_key)
        elif provider_id == 'yandexgpt':
            api_key = os.environ.get('YANDEXGPT_API_KEY', '')
            folder_id = os.environ.get('YANDEXGPT_FOLDER_ID', '')
            validation_result = validate_yandexgpt_key(api_key, folder_id)
        elif provider_id == 'gptunnel_chatgpt':
            api_key = os.environ.get('GPTUNNEL_API_KEY', '')
            validation_result = validate_gptunnel_key(api_key, 'gpt-4o')
        elif provider_id == 'gptunnel_claude':
            api_key = os.environ.get('GPTUNNEL_API_KEY', '')
            validation_result = validate_gptunnel_key(api_key, 'claude-3-5-sonnet-20241022')
        else:
            validation_result = {'valid': False, 'message': 'Unknown provider'}
        
        if not validation_result['valid']:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'Key validation failed',
                    'message': validation_result['message']
                })
            }
        
        cur.execute("SELECT COUNT(*) FROM ai_settings")
        count = cur.fetchone()[0]
        
        if count == 0:
            cur.execute("INSERT INTO ai_settings (active_provider) VALUES (%s)", (provider_id,))
        else:
            cur.execute("UPDATE ai_settings SET active_provider = %s, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM ai_settings ORDER BY id LIMIT 1)", (provider_id,))
        
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'active_provider': provider_id,
                'validation': validation_result
            })
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }