@echo off
set fileNumber=%1
set fileType=%2


docker cp "src/database/files/%fileNumber%.%fileType%" "acpjs:/app/code.%fileType%"
docker cp "src/database/files/%fileNumber%_t.txt" "acpjs:/app/files/input.txt"
docker cp "src/database/files/%fileNumber%_s.txt" "acpjs:/app/files/ans.txt"

docker exec -i acpjs python3 app/tester.py %fileType%
