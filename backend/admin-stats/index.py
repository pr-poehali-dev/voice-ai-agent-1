import json
import os
import psycopg2
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get feedback statistics for admin panel
    Args: event with httpMethod and X-Admin-Token header
    Returns: Feedback statistics including total counts, recent feedback, and ratings distribution
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
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
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN feedback_type = 'positive' THEN 1 ELSE 0 END) as positive_count,
            SUM(CASE WHEN feedback_type = 'negative' THEN 1 ELSE 0 END) as negative_count
        FROM message_feedback
    """)
    
    stats_row = cur.fetchone()
    total_count = stats_row[0] if stats_row else 0
    positive_count = stats_row[1] if stats_row else 0
    negative_count = stats_row[2] if stats_row else 0
    
    cur.execute("""
        SELECT 
            message_id,
            user_message,
            agent_response,
            feedback_type,
            created_at
        FROM message_feedback
        ORDER BY created_at DESC
        LIMIT 50
    """)
    
    recent_feedback: List[Dict[str, Any]] = []
    for row in cur.fetchall():
        recent_feedback.append({
            'message_id': row[0],
            'user_message': row[1][:100] if row[1] else '',
            'agent_response': row[2][:100] if row[2] else '',
            'feedback_type': row[3],
            'created_at': row[4].isoformat() if row[4] else None
        })
    
    cur.close()
    conn.close()
    
    result = {
        'total': total_count,
        'positive': positive_count,
        'negative': negative_count,
        'positive_rate': round(positive_count / total_count * 100, 1) if total_count > 0 else 0,
        'recent_feedback': recent_feedback
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps(result)
    }
