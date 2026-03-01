
#!/bin/bash
# Moto Gestor - Backup Automatizado do PostgreSQL
# Configurado para rodar via Crontab (0 3 * * * -> Todo dia as 3 da manhã)

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/motogestor"
CONTAINER_NAME="motogestor-db-1"
DB_USER="motouser"
DB_NAME="motogestor"

# Garante que o diretório existe
mkdir -p $BACKUP_DIR

echo "[$(date)] Iniciando Backup: $DB_NAME"

# Dump direto do container Docker para arquivo comprimido
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup concluído: backup_$TIMESTAMP.sql.gz"
    
    # Rotação: Remove arquivos com mais de 7 dias
    find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete
    echo "[$(date)] Rotação de logs antigos concluída."
else
    echo "[$(date)] ERRO: Falha no backup do banco de dados."
    exit 1
fi
