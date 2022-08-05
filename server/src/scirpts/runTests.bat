@echo off
set fileNumber=%1
set fileType=%2


docker cp "src/database/files/%fileNumber%.%fileType%" "elated_yalow:/app/code.%fileType%"
docker cp "src/database/files/%fileNumber%_t.txt" "elated_yalow:/app/files/input.txt"
docker cp "src/database/files/%fileNumber%_s.txt" "elated_yalow:/app/files/ans.txt"

docker exec -i elated_yalow python3 app/tester.py %fileType%
