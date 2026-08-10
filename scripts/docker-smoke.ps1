$ErrorActionPreference = 'Stop'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker is not installed or is not available on PATH.'
}

try {
  docker compose --file docker-compose.smoke.yml up --build --detach --wait
  if ($LASTEXITCODE -ne 0) { throw 'Docker Compose startup failed.' }

  $predictionHealth = Invoke-RestMethod 'http://127.0.0.1:8001/health'
  $apiHealth = Invoke-RestMethod 'http://127.0.0.1:3000/api/v1/health'

  docker compose --file docker-compose.smoke.yml exec --no-TTY api node -e "fetch(process.env.BODY_WEIGHT_PREDICTION_SERVICE_URL + '/health').then(async response => { if (!response.ok) process.exit(1); console.log(JSON.stringify(await response.json())) }).catch(error => { console.error(error.message); process.exit(1) })"
  if ($LASTEXITCODE -ne 0) { throw 'Node-to-Python container communication failed.' }

  Write-Output ('FastAPI health: ' + ($predictionHealth | ConvertTo-Json -Compress))
  Write-Output ('Express health: ' + ($apiHealth | ConvertTo-Json -Compress))
  Write-Output 'Node-to-Python communication: passed'
}
finally {
  docker compose --file docker-compose.smoke.yml down --remove-orphans
}
