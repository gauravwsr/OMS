# Gunicorn configuration file for Face Recognition Server

# Server socket
bind = "146.190.165.62:5002"
backlog = 2048

# Worker processes
workers = 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests, to help prevent memory leaks
max_requests = 1000
max_requests_jitter = 100

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = 'face_recognition_server'

# Server mechanics
preload_app = True
daemon = False
pidfile = '/tmp/face_recognition_server.pid'
user = None
group = None
tmp_upload_dir = None

# SSL (disabled for now)
keyfile = None
certfile = None
