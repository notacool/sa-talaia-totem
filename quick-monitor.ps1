# Monitor Rápido de Workflow - Sa Talaia Totem
# Monitorea el estado del workflow cada 10 minutos

$RunId = "17293493493"
$JobId = "49086081027"
$IntervalMinutes = 10

Write-Host "🚀 Monitor Rápido de Workflow GitHub Actions" -ForegroundColor Magenta
Write-Host "📱 Proyecto: Sa Talaia Totem" -ForegroundColor Cyan
Write-Host "⏰ Verificando cada $IntervalMinutes minutos" -ForegroundColor Yellow
Write-Host "─" * 60 -ForegroundColor Gray

$iteration = 1

while ($true) {
    Write-Host "`n🔄 Verificación #$iteration - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
    Write-Host "─" * 60 -ForegroundColor Gray
    
    try {
        # Obtener estado del job
        $jobStatus = gh run view --job=$JobId --json status,conclusion,steps
        
        if ($LASTEXITCODE -eq 0) {
            $jobData = $jobStatus | ConvertFrom-Json
            
            Write-Host "📊 Estado: $($jobData.status)" -ForegroundColor Cyan
            
            # Mostrar pasos completados
            $completedSteps = ($jobData.steps | Where-Object { $_.status -eq "completed" }).Count
            $totalSteps = $jobData.steps.Count
            
            Write-Host "📋 Progreso: $completedSteps/$totalSteps pasos completados" -ForegroundColor Yellow
            
            # Verificar si está completado
            if ($jobData.status -eq "completed") {
                Write-Host "`n🎉 ¡Workflow Completado!" -ForegroundColor Green
                Write-Host "📱 APKs generados exitosamente" -ForegroundColor Green
                Write-Host "🔗 Revisa: https://github.com/notacool/sa-talaia-totem/releases" -ForegroundColor Cyan
                break
            }
            
            # Mostrar pasos en progreso
            $inProgressSteps = $jobData.steps | Where-Object { $_.status -eq "in_progress" }
            if ($inProgressSteps) {
                Write-Host "🔄 En progreso:" -ForegroundColor Yellow
                foreach ($step in $inProgressSteps) {
                    Write-Host "   • $($step.name)" -ForegroundColor Yellow
                }
            }
            
        } else {
            Write-Host "❌ Error al obtener estado" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    $iteration++
    
    if ($iteration -gt 1) {
        Write-Host "`n⏰ Esperando $IntervalMinutes minutos..." -ForegroundColor Gray
        Write-Host "🔄 Próxima verificación: $((Get-Date).AddMinutes($IntervalMinutes).ToString('HH:mm:ss'))" -ForegroundColor Gray
        Write-Host "⏸️ Ctrl+C para detener" -ForegroundColor Yellow
        
        Start-Sleep -Seconds ($IntervalMinutes * 60)
    }
}
