from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from decouple import config

from .tasks import send_weekly_digest, daily_crawl_scholarships

def _verify_cron_secret(request):
    """Verify the request contains a valid Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    cron_secret = config('CRON_SECRET', default=settings.SECRET_KEY)
    expected_header = f'Bearer {cron_secret}'
    return auth_header == expected_header

@csrf_exempt
def cron_weekly_digest(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not _verify_cron_secret(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    result = send_weekly_digest()
    return JsonResponse({'status': 'success', 'message': result})

@csrf_exempt
def cron_daily_crawl(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not _verify_cron_secret(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    result = daily_crawl_scholarships()
    return JsonResponse({'status': 'success', 'message': result})
