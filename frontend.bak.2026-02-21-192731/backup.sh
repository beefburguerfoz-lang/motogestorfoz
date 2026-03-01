
#!/bin/bash
# Backup script para Moto Gestor

# Configurações
BACKUP_PATH="./backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
CONTAINER_NAME="motogestor-db"
DB_USER="motouser"
DB_NAME="motogestor"

mkdir -p $BACKUP_PATH

echo "Iniciando backup do banco de dados..."
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > $BACKUP_PATH/backup_$TIMESTAMP.sql

# Compacta o backup
gzip $BACKUP_PATH/backup_$TIMESTAMP.sql

# Remove backups com mais de 7 dias
find $BACKUP_PATH -type f -name "*.sql.gz" -mtime +7 -delete

echo "Backup concluído com sucesso em $BACKUP_PATH/backup_$TIMESTAMP.sql.gz"
