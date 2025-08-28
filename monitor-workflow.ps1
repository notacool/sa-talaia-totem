# Monitor de Workflow GitHub Actions - Sa Talaia Totem
# Este script monitorea el progreso del workflow cada 10 minutos

param(
    [string]$RunId = "17293493493",
    [string]$JobId = "49086081027",
    [int]$IntervalMinutes = 10
)

# Colores para la consola
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

# Función para escribir con color
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

# Función para obtener timestamp
function Get-Timestamp {
    return Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

# Función para mostrar el estado del workflow
function Show-WorkflowStatus {
    param(
        [string]$RunId,
        [string]$JobId
    )
    
    try {
        Write-ColorOutput "`n🔄 Verificando estado del workflow..." "Info"
        Write-ColorOutput "⏰ Timestamp: $(Get-Timestamp)" "Info"
        Write-ColorOutput "🔗 Run ID: $RunId" "Info"
        Write-ColorOutput "🔧 Job ID: $JobId" "Info"
        Write-ColorOutput "─" * 80 "Header"
        
        # Obtener estado del job
        $jobStatus = gh run view --job=$JobId --json status,conclusion,startedAt,completedAt,steps
        
        if ($LASTEXITCODE -eq 0) {
            $jobData = $jobStatus | ConvertFrom-Json
            
            # Mostrar información del job
            Write-ColorOutput "📊 Estado del Job: $($jobData.status)" "Header"
            
            if ($jobData.startedAt) {
                Write-ColorOutput "🚀 Iniciado: $($jobData.startedAt)" "Info"
            }
            
            if ($jobData.completedAt) {
                Write-ColorOutput "✅ Completado: $($jobData.completedAt)" "Success"
            }
            
            # Mostrar estado de los pasos
            Write-ColorOutput "`n📋 Estado de los Pasos:" "Header"
            Write-ColorOutput "─" * 80 "Header"
            
            foreach ($step in $jobData.steps) {
                $stepName = $step.name
                $stepStatus = $step.status
                $stepConclusion = $step.conclusion
                
                switch ($stepStatus) {
                    "completed" {
                        $statusIcon = "✅"
                        $color = "Success"
                    }
                    "in_progress" {
                        $statusIcon = "🔄"
                        $color = "Warning"
                    }
                    "queued" {
                        $statusIcon = "⏳"
                        $color = "Info"
                    }
                    "waiting" {
                        $statusIcon = "⏳"
                        $color = "Info"
                    }
                    default {
                        $statusIcon = "❓"
                        $color = "Warning"
                    }
                }
                
                Write-ColorOutput "$statusIcon $stepName" $color
            }
            
            # Verificar si el job está completado
            if ($jobData.status -eq "completed") {
                Write-ColorOutput "`n🎉 ¡Workflow Completado!" "Success"
                Write-ColorOutput "📱 APKs generados exitosamente" "Success"
                Write-ColorOutput "🔗 Revisa el release en GitHub" "Info"
                return $true
            }
            
        } else {
            Write-ColorOutput "❌ Error al obtener estado del workflow" "Error"
        }
        
    } catch {
        Write-ColorOutput "❌ Error: $($_.Exception.Message)" "Error"
    }
    
    return $false
}

# Función para mostrar progreso general
function Show-Progress {
    param(
        [string]$RunId
    )
    
    try {
        Write-ColorOutput "`n📈 Progreso General del Workflow:" "Header"
        Write-ColorOutput "─" * 80 "Header"
        
        # Obtener información del run
        $runInfo = gh run view $RunId --json status,conclusion,createdAt,updatedAt,event,headBranch
        
        if ($LASTEXITCODE -eq 0) {
            $runData = $runInfo | ConvertFrom-Json
            
            Write-ColorOutput "🏷️ Tag: $($runData.headBranch)" "Info"
            Write-ColorOutput "📅 Creado: $($runData.createdAt)" "Info"
            Write-ColorOutput "🔄 Última actualización: $($runData.updatedAt)" "Info"
            Write-ColorOutput "🎯 Evento: $($runData.event)" "Info"
            Write-ColorOutput "📊 Estado: $($runData.status)" "Header"
            
            if ($runData.conclusion) {
                Write-ColorOutput "🏁 Conclusión: $($runData.conclusion)" "Success"
            }
        }
        
    } catch {
        Write-ColorOutput "❌ Error al obtener información del run: $($_.Exception.Message)" "Error"
    }
}

# Función para mostrar artifacts disponibles
function Show-Artifacts {
    param(
        [string]$RunId
    )
    
    try {
        Write-ColorOutput "`n📦 Artifacts Disponibles:" "Header"
        Write-ColorOutput "─" * 80 "Header"
        
        $artifacts = gh run view $RunId --json artifacts
        
        if ($LASTEXITCODE -eq 0) {
            $artifactsData = $artifacts | ConvertFrom-Json
            
            if ($artifactsData.artifacts.Count -gt 0) {
                foreach ($artifact in $artifactsData.artifacts) {
                    Write-ColorOutput "📁 $($artifact.name) - $($artifact.sizeInBytes) bytes" "Info"
                }
            } else {
                Write-ColorOutput "⏳ No hay artifacts disponibles aún" "Warning"
            }
        }
        
    } catch {
        Write-ColorOutput "❌ Error al obtener artifacts: $($_.Exception.Message)" "Error"
    }
}

# Función principal de monitoreo
function Start-Monitoring {
    param(
        [string]$RunId,
        [string]$JobId,
        [int]$IntervalMinutes
    )
    
    Write-ColorOutput "🚀 Iniciando Monitor de Workflow GitHub Actions" "Header"
    Write-ColorOutput "📱 Proyecto: Sa Talaia Totem" "Header"
    Write-ColorOutput "⏰ Intervalo de monitoreo: $IntervalMinutes minutos" "Header"
    Write-ColorOutput "🔄 Run ID: $RunId" "Header"
    Write-ColorOutput "🔧 Job ID: $JobId" "Header"
    Write-ColorOutput "─" * 80 "Header"
    
    $iteration = 1
    $completed = $false
    
    while (-not $completed) {
        Write-ColorOutput "`n🔄 Iteración #$iteration - $(Get-Timestamp)" "Header"
        Write-ColorOutput "─" * 80 "Header"
        
        # Mostrar estado del workflow
        $completed = Show-WorkflowStatus -RunId $RunId -JobId $JobId
        
        # Mostrar progreso general
        Show-Progress -RunId $RunId
        
        # Mostrar artifacts
        Show-Artifacts -RunId $RunId
        
        if ($completed) {
            Write-ColorOutput "`n🎉 ¡Monitoreo Completado!" "Success"
            Write-ColorOutput "📱 APKs generados exitosamente" "Success"
            Write-ColorOutput "🔗 Revisa: https://github.com/notacool/sa-talaia-totem/releases" "Info"
            break
        }
        
        $iteration++
        
        if ($iteration -gt 1) {
            Write-ColorOutput "`n⏰ Esperando $IntervalMinutes minutos para la siguiente verificación..." "Info"
            Write-ColorOutput "🔄 Próxima verificación: $((Get-Date).AddMinutes($IntervalMinutes).ToString('HH:mm:ss'))" "Info"
            Write-ColorOutput "⏸️ Presiona Ctrl+C para detener el monitoreo" "Warning"
            
            Start-Sleep -Seconds ($IntervalMinutes * 60)
        }
    }
}

# Función para mostrar ayuda
function Show-Help {
    Write-ColorOutput "`n📖 Uso del Monitor de Workflow:" "Header"
    Write-ColorOutput "─" * 80 "Header"
    Write-ColorOutput "Sintaxis:" "Info"
    Write-ColorOutput "  .\monitor-workflow.ps1 [RunId] [JobId] [IntervalMinutes]" "Info"
    Write-ColorOutput "`nParámetros:" "Info"
    Write-ColorOutput "  RunId           - ID del workflow run (default: 17293493493)" "Info"
    Write-ColorOutput "  JobId           - ID del job (default: 49086081027)" "Info"
    Write-ColorOutput "  IntervalMinutes - Intervalo de monitoreo en minutos (default: 10)" "Info"
    Write-ColorOutput "`nEjemplos:" "Info"
    Write-ColorOutput "  .\monitor-workflow.ps1" "Info"
    Write-ColorOutput "  .\monitor-workflow.ps1 17293493493 49086081027 5" "Info"
    Write-ColorOutput "  .\monitor-workflow.ps1 -IntervalMinutes 15" "Info"
}

# Verificar si se solicita ayuda
if ($args -contains "-h" -or $args -contains "--help" -or $args -contains "-?") {
    Show-Help
    exit 0
}

# Iniciar monitoreo
try {
    Start-Monitoring -RunId $RunId -JobId $JobId -IntervalMinutes $IntervalMinutes
} catch {
    Write-ColorOutput "❌ Error fatal: $($_.Exception.Message)" "Error"
    Write-ColorOutput "🔧 Verifica que GitHub CLI esté instalado y autenticado" "Warning"
    Write-ColorOutput "📖 Usa -h para ver la ayuda" "Info"
    exit 1
}
