---
author: BENTEGAR Sid Ahmed Abdelillah
pubDatetime: 2025-02-13T15:22:00Z
title: Deploying laravel application to production ready vps
postSlug: deploying-laravel-into-a-production-ready-vps
featured: true
tags:
  - php
  - laravel
  - linux
  - devops
description: In this post i will be talking about deploying a laravel application into a production ready vps
---

## Table of content

## Introduction

In this post, we will be deploying our Laravel project, which includes a Laravel backend integrated with a React frontend. We will utilize various optimizations to achieve the best possible setup. This includes setting up PHP, Octane, connection pools with ProxySQL, Redis cache, and worker pools for Laravel queues. By the end of this guide, you will have a highly optimized and production-ready deployment of your Laravel application on a VPS.

## Prerequisites

Before we begin, make sure you have the following:

- **A VPS:** A fresh installation of a Linux distribution (e.g., Ubuntu 20.04).
- **SSH Access:** Ensure you have SSH access to the VPS.
- **Basic Knowledge:** Familiarity with Linux command line operations.
- **Laravel Application:** A Laravel application ready for deployment.
- **Domain Name:** Optional, but recommended for easier access.
- **Public SSH Key:** For secure access to the VPS.
- **Git:** Installed on your local machine for cloning the repository.
- **Composer:** Installed on your local machine for managing PHP dependencies.

## Installing PHP and Composer on the VPS

To run a Laravel application, we need to install PHP and Composer on our VPS. Follow these steps to set up PHP and Composer:

1. Update the package list and upgrade installed packages:

```bash
sudo apt update && sudo apt upgrade -y
```

2. Install PHP and required extensions:

```bash
sudo apt install php-mysql php-xml php-mbstring php-zip php-curl -y
```

3. Verify php installation:

```bash
php -v
```

4. Install Composer:

```bash
sudo apt install curl -y
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

5. Verify composer installation:

```bash
composer -v
```

With PHP and Composer installed, we are now ready to proceed with setting up our Laravel application on the VPS. Note that this has installed php and composer for all the users on our linux machine.

## Setting Up the Website with Nginx and Octane

To set up our website, we need to install Nginx, create a user to handle the web server, clone the website, initialize the Laravel project, configure environment variables, test the database connection, migrate and seed the database, start Octane, and set up Nginx as a reverse proxy.

### What is Octane

Laravel Octane is a package that supercharges your Laravel application's performance by running it as a long-lived process. Unlike the traditional PHP-FPM setup, where the Laravel application is booted on each request, Octane keeps the application in memory, significantly reducing the overhead of booting the framework for every request

### Benefits of Using Octane

1. **Performance:** By keeping the application in memory, Octane eliminates the need to boot the Laravel framework on each request, resulting in faster response times.
2. **Concurrency:** Octane supports concurrent request handling, which can improve the throughput of your application.
3. **Scalability:** With Octane, you can handle more requests per second, making your application more scalable.

### Difference from PHP-FPM

- **PHP-FPM:** Each request to the server boots the entire Laravel framework, processes the request, and then shuts down. This can introduce latency due to the repeated bootstrapping process.

![storing-the-sensitive-data](/assets/img/deploying-laravel-into-a-production-ready-vps/nginx-fpm.png)

- **Octane:** The application is booted once and kept in memory, allowing subsequent requests to be handled much faster as the framework does not need to be reloaded.

![storing-the-sensitive-data](/assets/img/deploying-laravel-into-a-production-ready-vps/nginx-octane.png)

By using Octane, you can achieve a more efficient and performant Laravel backend, making it well-suited for high-traffic applications.

### Setting Up Nginx and it's user

1. Install Nginx:

```bash
sudo apt install nginx -y
```

2. Start and enable Nginx:

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

3. Create a new user for Nginx:

```bash
sudo adduser --system --no-create-home --group www
```

### Setting Up the Laravel Application

1. Clone your Laravel application from the repository:

```bash
sudo mkdir -p /var/www/your-laravel-app
sudo chown -R www:www /var/www/your-laravel-app
cd /var/www/your-laravel-app
sudo git clone https://github.com/<yourusername>/<your-laravel-app>.git .
```

2. Install Laravel dependencies:

```bash
sudo -u www composer install --optimize-autoloader --no-dev
```

3. Copy the `.env.example` file:

```bash
sudo -u www cp .env.example .env
```

4. Generate the application key:

```bash
sudo -u www php artisan key:generate
```

5. Update the .env file with your database and other configuration settings:

```bash
sudo -u www vim .env
```

### Test Database Connection, Migrate and Seed the Database

1. Test the database connection:

```bash
sudo -u www php artisan migrate:status
```

2. Run the database migrations:

```bash
sudo -u www php artisan migrate --force
```

3. Run the database seeders (if any):

```bash
sudo -u www php artisan db:seed --force
```

### Optimize and cache Laravel configuration

1. Optimize the Laravel configuration:

```bash
sudo -u www php artisan config:cache
```

2. Cache the routes:

```bash
sudo -u www php artisan route:cache
```

3. Optimize the application:

```bash
sudo -u www php artisan optimize
```

### Starting Octane

1. Install the Octane package:

```bash
sudo -u www composer require laravel/octane
```

2. Setup Octane:

```bash
sudo -u www php artisan octane:install
```

This will install the underlying php runtime and octane configuration file. The runtime will be automatically downloaded. 3. Start Octane:

```bash
sudo -u www php artisan octane:start
```

This will start octane as a forground running process. You can stop it by pressing `Ctrl + C`, for the moment don't stop it, open another ssh connection and type the commande below to check if octane is running:

```bash
curl localhost:8000
```

You should see the response of your laravel application. If you see the response, then octane is running correctly you can stop it by pressing `Ctrl + C`.

### Setup octane as a service

1. Create a new service file:

```bash
sudo vim /etc/systemd/system/octane.service
```

2. Add the following content to the file:

```bash
[Unit]
Description=Octane Service
After=network.target

[Service]
Type=simple
User=www
Group=www
WorkingDirectory=/var/www/your-laravel-app

ExecStart=/usr/bin/php /var/www/your-laravel-app/artisan octane:start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

3. Reload the systemd daemon:

```bash
sudo systemctl daemon-reload
```

4. Start and enable the Octane service:

```bash
sudo systemctl start octane
sudo systemctl enable octane
```

### Setting Up Nginx as a Reverse Proxy

1. Create a new Nginx configuration file:

```bash
sudo vim /etc/nginx/sites-available/yourdomain.com
```

2. Add the following content to the file:

```bash
server {
  listen 80;
  server_name yourdomain.com;
  root /var/www/your-laravel-app/public;

  index index.php;
  charset utf-8;

  location ~* \.(?:css|js|gif|jpg|jpeg|png|ico|woff2?|ttf|svg|eot|otf|webp|avif)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
    access_log off;
  }

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme; # This is crucial
    proxy_buffer_size 16k;
    proxy_buffers 4 32k;
    proxy_busy_buffers_size 64k;
    # Forward to Octane
    proxy_pass http://127.0.0.1:8000;
  }

  # Disable logging for certain files
  location = /favicon.ico { access_log off; log_not_found off; }
  location = /robots.txt { access_log off; log_not_found off; }

  error_log /var/log/nginx/yourdomain.com_error.log;
  access_log /var/log/nginx/yourdomain.com_access.log;

  error_page 404 /index.php;

}
```

3. Enable the new configuration and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

With these steps, your Laravel application should be up and running with Nginx and Octane on your VPS. You can now access your application using your domain name or IP address.

### Getting an SSL Certificate with Certbot and Let's Encrypt

1. Install Certbot:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

2. Obtain an SSL certificate:

```bash
sudo certbot --nginx -d yourdomain.com
```

Follow the prompts to complete the installation.
Certbot will automatically configure Nginx to use the new SSL certificate.

With these steps, your Laravel application will be secured with an SSL certificate from Let's Encrypt, ensuring encrypted communication between your server and clients.

### Current State

At this point, we have a fully functional Laravel Octane and Nginx setup with a secure HTTPS connection. Our Laravel application is running efficiently with Octane, and Nginx is configured as a reverse proxy. Additionally, we have successfully connected to the database, ensuring that our application can interact with the database securely and efficiently.

## Setting Up Connection Pools with ProxySQL

### The probleme with PHP and laravel MySQL connections

In a typical Laravel application, a new database connection is established for each query on every request. This can become a significant performance bottleneck, especially when the database server is not on the same host and could be on a different network altogether. The time required to establish each TCP connection can accumulate, leading to increased latency and reduced performance in large-scale applications.

### Solution: Connection Pools with ProxySQL

To address this issue, we will use ProxySQL, a high-performance SQL proxy. ProxySQL helps by establishing a connection pool to our MySQL server and maintaining persistent TCP sockets between itself and the database server. This means that instead of establishing a new connection for each query, Laravel will connect to ProxySQL on localhost, which is much faster. ProxySQL will then route the query to the MySQL server, reducing the overhead of establishing new connections.

### Benefits of Using ProxySQL

1. **Connection Pooling:** ProxySQL maintains persistent connections to the database server, reducing the overhead of establishing new connections.
2. **Load Balancing:** ProxySQL can distribute queries across multiple database servers, improving performance and scalability.
3. **Query Caching:** ProxySQL can cache query results, reducing the load on the database server and improving response times.

![storing-the-sensitive-data](/assets/img/deploying-laravel-into-a-production-ready-vps/proxySQL.png)

By using ProxySQL, we can optimize our Laravel application's database interactions, making it more efficient and scalable.

### Installing and Configuring ProxySQL

We will be installing proxySQL on it's own directory on /opt and with it's own user and group. This will make server and security management easier.

1. Install ProxySQL:
1. Create a new user and group for ProxySQL:

```bash
sudo adduser --system --no-create-home --group proxysql
```

2. Download the ProxySQL .deb package:

```bash
cd /tmp
wget https://github.com/sysown/proxysql/releases/download/v2.0.17/proxysql_2.0.17-debian10_amd64.deb
```

3. Extract ProxySQL into /opt/proxysql

```bash
sudo dpkg -x proxysql_2.0.17-debian10_amd64.deb /opt/proxysql
```

4. Create var and data Folders

```bash
sudo mkdir -p /opt/proxysql/var
sudo mkdir -p /opt/proxysql/data
sudo chown -R proxysql:proxysql /opt/proxysql
```

5. Modify the proxysql.cfg

```bash
sudo vim /opt/proxysql/proxysql.cfg
```

6. Add the following content to the file:

```bash
datadir="/opt/proxysql/var/lib/proxysql"
errorlog="/opt/proxysql/var/lib/proxysql/proxysql.log"

admin_variables=
{
	admin_credentials="admin:admin"
	mysql_ifaces="127.0.0.1:6032"
}

mysql_variables=
{
	threads=4
	max_connections=2048
	default_query_delay=0
	default_query_timeout=36000000
	have_compress=true
	poll_timeout=2000
	interfaces="0.0.0.0:6033"
	default_schema="information_schema"
	stacksize=1048576
	server_version="5.5.30"
	connect_timeout_server=3000
	monitor_username="monitor"
	monitor_password="monitor"
	monitor_history=600000
	monitor_connect_interval=60000
	monitor_ping_interval=10000
	monitor_read_only_interval=1500
	monitor_read_only_timeout=500
	ping_interval_server_msec=120000
	ping_timeout_server=500
	commands_stats=true
	sessions_sort=true
	connect_retries_on_failure=10
have_ssl = false
}

# defines all the MySQL servers
mysql_servers =
(
{
  address=<remote_ip_or_host>
  port=<remote_port>
  hostgroup=0
  max_connections=100
}
)


# defines all the MySQL users
mysql_users:
(
{
  username="user"
  password="pass"
  default_hostgroup=0
}
)
```

Change the host and the port of the remote mysql database and the user credetials.

### Creating and Configuring ProxySQL service

1. Create a new service file:

```bash
sudo vim /etc/systemd/system/proxysql.service
```

2. Add the following content to the file:

```bash
[Unit]
Description=High Performance Advanced Proxy for MySQL
After=network.target

[Service]
User=proxysql
Group=proxysql
Type=forking
RuntimeDirectory=proxysql
ExecStart=/opt/proxysql/usr/bin/proxysql --idle-threads  -c /opt/proxysql/etc/proxysql.cnf -D /opt/proxysql/var/lib/proxysql --initial
PIDFile=/opt/proxysql/var/lib/proxysql/proxysql.pid
SyslogIdentifier=proxysql
Restart=no
User=proxysql
Group=proxysql
PermissionsStartOnly=true
UMask=0007
LimitNOFILE=102400
LimitCORE=1073741824
ProtectHome=yes
NoNewPrivileges=true
CapabilityBoundingSet=CAP_SETGID CAP_SETUID CAP_SYS_RESOURCE
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX AF_ALG
ProtectSystem=full
PrivateDevices=yes


[Install]
WantedBy=multi-user.target
```

3. Reload systemd and start ProxySQL:

```bash
sudo systemctl daemon-reload
sudo systemctl start proxysql
sudo systemctl enable proxysql
```

4. Check the status of ProxySQL:

```bash
sudo systemctl status proxysql
```

With these steps, ProxySQL will be installed and configured on your server, ready to optimize your Laravel application's database connections.

### Configuring Laravel to Use ProxySQL

To configure Laravel to use ProxySQL, update the database configuration in your `.env` file to point to the ProxySQL server instead of the MySQL server. Update the `DB_HOST`, `DB_PORT` variables to match the ProxySQL configuration.

```bash
...
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=6033
...
```

With this configuration, Laravel will connect to ProxySQL on localhost, which will route the queries to the MySQL server, optimizing the database connections.

### Current State

At this point, we have successfully installed and configured ProxySQL on our server. We have:

With ProxySQL running, our Laravel application can now benefit from connection pooling and persistent connections, significantly improving performance by reducing the overhead of establishing new connections for each query. This setup ensures that connections to the MySQL server are efficiently managed, providing a faster and more scalable application.

## Caching and Redis

Currently, our Laravel application is using disk caching, which can be slower compared to an in-memory cache like Redis. Redis is a high-performance, in-memory data store that can be used as a cache to speed up our application by reducing the time it takes to retrieve frequently accessed data.

By using Redis, we can significantly improve the performance of our application by storing cache data in memory, which is much faster than reading from disk. This can lead to faster response times and improved scalability, making our application more efficient.

### Installing and Configuring Redis

To install Redis, follow these steps:

1. Install Redis:

```bash
sudo apt update
sudo apt install redis-server -y
```

2. Configure Redis:

```bash
sudo vim /etc/redis/redis.conf
```

Find the supervised directive and set it to systemd:

```bash
supervised systemd
```

3. Start and enable Redis:

```bash
sudo systemctl restart redis
sudo systemctl enable redis
```

4. Verify Redis is running:

```bash
redis-cli ping
```

You should see the response `PONG`.

### Configuring Laravel to Use Redis

1. To configure Laravel to use Redis for caching, update the `CACHE_DRIVER` and `SESSION_DRIVER` variable in your `.env` file to use Redis:

```bash
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

2. Update the `REDIS_HOST` and `REDIS_PORT` variables to match the Redis configuration:

```bash
SESSION_DRIVER=redis
REDIS_CLIENT=phpredis
REDIS_HOST=localhost
REDIS_PASSWORD=null
REDIS_PORT=6379
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
```

3. Install predis package:

```bash
sudo -u www composer require predis/predis
```

4. Clear the Laravel cache:

```bash
sudo -u www php artisan cache:clear
```

5. Regenerate the Laravel configuration cache:

```bash
sudo -u www php artisan config:cache
sudo -u www php artisan optimize
```

6. Restart the Laravel application:

```bash
sudo systemctl restart octane
```

With Redis configured, our Laravel application will now use Redis as the cache store, improving performance by storing cache data in memory.

## Configuring the Firewall on Ubuntu

To enhance the security of your VPS, it's important to configure the firewall to allow only necessary ports. In this case, we will allow only SSH (port 22), HTTP (port 80), and HTTPS (port 443) connections.
Of course we can also configure firewall rules on the VPC level (for AWS or GCP), VNet ( for Azure ) or the VCN ( for OCI ) to restrict the access to the VPS. But for this article i will be focusing on the VPS level.

1. Install UFW (Uncomplicated Firewall):

```bash
sudo apt install ufw -y
```

2. Allow SSH, HTTP, and HTTPS connections:

```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
```

3. Enable the firewall:

```bash
sudo ufw enable
```

4. Check the status of the firewall:

```bash
sudo ufw status
```

With these steps, your firewall is configured to allow only SSH, HTTP, and HTTPS connections, enhancing the security of your VPS by blocking all other ports.

## Finale State

At this point, we have successfully deployed our Laravel application to a production-ready VPS. We have:

- Set up PHP and Composer.
- Configured Nginx and Laravel Octane for optimal performance.
- Secured our application with an SSL certificate from Let's Encrypt.
- Installed and configured ProxySQL for efficient database connection pooling.
- Installed and configured Redis for faster caching.
- Configured the firewall to allow only necessary ports (22, 80, 443).

Our Laravel application is now running efficiently with a secure HTTPS connection and optimized database interactions.

## Conclusion

Deploying a Laravel application to a production-ready VPS involves several steps to ensure optimal performance, security, and scalability. By following this guide, you have set up a robust environment for your Laravel application, leveraging tools like Nginx, Laravel Octane, ProxySQL, and Redis to enhance performance and reliability.

## What's Next

In the next article, we will dive into monitoring your server and application. We will explore tools and techniques to keep an eye on your server's performance, detect issues early, and ensure your application runs smoothly. Stay tuned for a comprehensive guide on server monitoring and maintenance.
