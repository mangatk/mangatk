import json
from django.contrib.auth import authenticate
from django.conf import settings
from rest_framework import authentication, exceptions
from jose import jwt
from urllib.request import urlopen

class Auth0JSONWebTokenAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', None)
        if not auth_header:
            return None

        parts = auth_header.split()
        if parts[0].lower() != 'bearer':
            return None
        elif len(parts) == 1:
            return None
        elif len(parts) > 2:
            return None

        token = parts[1]
        
        try:
            unverified_header = jwt.get_unverified_header(token)
        except jwt.JWTError:
            return None

        if unverified_header.get('alg') != 'RS256' or 'kid' not in unverified_header:
            return None
            
        # Get the public keys from Auth0
        jwks_url = f'https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json'
        try:
            jwks = json.loads(urlopen(jwks_url).read())
        except Exception:
            raise exceptions.AuthenticationFailed('Error fetching JWKS from Auth0')
        
        rsa_key = {}
        for key in jwks.get('keys', []):
            if key.get('kid') == unverified_header['kid']:
                rsa_key = {
                    'kty': key['kty'],
                    'kid': key['kid'],
                    'use': key['use'],
                    'n': key['n'],
                    'e': key['e']
                }
                break
        if rsa_key:
            try:
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=['RS256'],
                    audience=settings.AUTH0_AUDIENCE,
                    issuer=f'https://{settings.AUTH0_DOMAIN}/'
                )
            except jwt.ExpiredSignatureError:
                raise exceptions.AuthenticationFailed('Token is expired')
            except jwt.JWTClaimsError:
                raise exceptions.AuthenticationFailed('Incorrect claims, check audience and issuer')
            except Exception:
                raise exceptions.AuthenticationFailed('Unable to parse authentication token')

            # If successful, get or create the Django user
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            sub = payload.get('sub')
            if not sub:
                raise exceptions.AuthenticationFailed('Token payload missing "sub" claim')
                
            email = payload.get('email', f"{sub}@example.com")
            
            try:
                user = User.objects.get(username=sub)
            except User.DoesNotExist:
                # Create a new user
                user = User.objects.create_user(
                    username=sub,
                    email=email,
                    password=None
                )
            
            # Sync Admin Role from Auth0 Custom Claims
            namespace = 'https://mangatk/'
            roles = payload.get(f'{namespace}roles', [])
            
            is_admin = 'admin' in roles
            if user.is_staff != is_admin or user.is_superuser != is_admin:
                user.is_staff = is_admin
                user.is_superuser = is_admin
                user.save(update_fields=['is_staff', 'is_superuser'])
                
            return (user, token)
            
        raise exceptions.AuthenticationFailed('Unable to find appropriate key')
