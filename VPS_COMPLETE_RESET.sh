#!/bin/bash

# ⚠️ WARNING: THIS WILL DELETE EVERYTHING ON YOUR VPS! ⚠️
# Run this script at your own risk. This is a complete system wipe.

echo "⚠️  WARNING: This will delete EVERYTHING on your VPS!"
echo "Press Ctrl+C within 10 seconds to cancel..."
sleep 10

# 1. Stop all running services
echo "Stopping all services..."
systemctl stop docker 2>/dev/null || true
systemctl stop docker.socket 2>/dev/null || true
systemctl stop containerd 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true
systemctl stop mysql 2>/dev/null || true
systemctl stop postgresql 2>/dev/null || true
systemctl stop node 2>/dev/null || true
systemctl stop pm2 2>/dev/null || true
systemctl stop focusrobin 2>/dev/null || true

# 2. Kill all Docker containers and remove everything
echo "Removing all Docker containers, images, volumes..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker rmi $(docker images -q) -f 2>/dev/null || true
docker volume rm $(docker volume ls -q) 2>/dev/null || true
docker network prune -f 2>/dev/null || true
docker system prune -a --volumes -f 2>/dev/null || true

# 3. Remove Docker completely
echo "Removing Docker..."
apt-get purge -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras 2>/dev/null || true
apt-get purge -y docker.io docker-doc docker-compose 2>/dev/null || true
rm -rf /var/lib/docker
rm -rf /var/lib/containerd
rm -rf /etc/docker
rm -rf /usr/local/bin/docker-compose
rm -rf ~/.docker

# 4. Remove all application directories
echo "Removing application directories..."
rm -rf /var/www/focusrobin
rm -rf /var/www/*
rm -rf /opt/focusrobin
rm -rf /home/*/focusrobin
rm -rf /root/focusrobin
rm -rf ~/focusrobin

# 5. Remove Node.js and npm
echo "Removing Node.js..."
apt-get purge -y nodejs npm 2>/dev/null || true
rm -rf /usr/local/bin/node
rm -rf /usr/local/bin/npm
rm -rf /usr/local/lib/node_modules
rm -rf /usr/local/include/node
rm -rf ~/.npm
rm -rf ~/.node-gyp
rm -rf ~/.nvm

# 6. Remove PM2
echo "Removing PM2..."
npm uninstall -g pm2 2>/dev/null || true
pm2 kill 2>/dev/null || true
rm -rf ~/.pm2
rm -rf /usr/local/bin/pm2

# 7. Remove Nginx
echo "Removing Nginx..."
apt-get purge -y nginx nginx-common 2>/dev/null || true
rm -rf /etc/nginx
rm -rf /var/www/html
rm -rf /var/log/nginx

# 8. Remove PostgreSQL (if installed outside Docker)
echo "Removing PostgreSQL..."
apt-get purge -y postgresql postgresql-contrib 2>/dev/null || true
rm -rf /var/lib/postgresql
rm -rf /etc/postgresql

# 9. Remove MySQL/MariaDB (if installed)
echo "Removing MySQL/MariaDB..."
apt-get purge -y mysql-server mysql-client mariadb-server mariadb-client 2>/dev/null || true
rm -rf /var/lib/mysql
rm -rf /etc/mysql

# 10. Remove all project files and logs
echo "Removing project files..."
find / -name "*focusrobin*" -type d -exec rm -rf {} + 2>/dev/null || true
find / -name "*focusrobin*" -type f -delete 2>/dev/null || true
rm -rf /var/log/focusrobin
rm -rf /tmp/focusrobin

# 11. Clean up system
echo "Cleaning up system..."
apt-get autoremove -y
apt-get autoclean -y
apt-get clean -y

# 12. Remove all user data (optional - be careful!)
# Uncomment if you want to delete all user home directories
# rm -rf /home/*

# 13. Clear all logs
echo "Clearing logs..."
journalctl --vacuum-time=1d
rm -rf /var/log/*.log
rm -rf /var/log/*.gz

# 14. Remove temporary files
echo "Removing temporary files..."
rm -rf /tmp/*
rm -rf /var/tmp/*

echo ""
echo "✅ Complete reset finished!"
echo "Your VPS is now clean. You can reinstall everything from scratch."










