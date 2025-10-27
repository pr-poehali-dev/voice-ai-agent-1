import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage AI provider settings (get active provider, set active provider, get available providers with status)
    Args: event with httpMethod (GET/POST), headers with X-Admin-Token, body with provider_id
    Returns: Active provider info and available providers list
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
                'active_provider': provider_id
            })
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }