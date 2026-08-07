[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
$handler = New-Object System.Net.Http.HttpClientHandler
$handler.ServerCertificateCustomValidationCallback = { return $true }
$client = New-Object System.Net.Http.HttpClient($handler)
$client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

$voicesDir = Join-Path $PSScriptRoot "..\server\voices"
if (-not (Test-Path $voicesDir)) {
    New-Item -ItemType Directory -Path $voicesDir | Out-Null
}

$models = @(
    @{ name = "en_GB-alan-medium"; baseurl = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium" },
    @{ name = "en_US-arctic-medium"; baseurl = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/arctic/medium/en_US-arctic-medium" },
    @{ name = "en_US-danny-medium"; baseurl = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/danny/medium/en_US-danny-medium" },
    @{ name = "en_US-l2arctic-medium"; baseurl = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/l2arctic/medium/en_US-l2arctic-medium" },
    @{ name = "en_GB-vctk-medium"; baseurl = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/vctk/medium/en_GB-vctk-medium" }
)

foreach ($m in $models) {
    $name = $m["name"]
    $baseurl = $m["baseurl"]
    
    $onnxPath = Join-Path $voicesDir "$name.onnx"
    $jsonPath = Join-Path $voicesDir "$name.onnx.json"
    
    # Remove zero-byte placeholders if present
    if ((Test-Path $onnxPath) -and ((Get-Item $onnxPath).Length -eq 0)) { Remove-Item $onnxPath }
    if ((Test-Path $jsonPath) -and ((Get-Item $jsonPath).Length -eq 0)) { Remove-Item $jsonPath }

    if (-not (Test-Path $onnxPath)) {
        Write-Host "Downloading $name.onnx..."
        $url = "$baseurl.onnx"
        $bytes = $client.GetByteArrayAsync($url).Result
        [System.IO.File]::WriteAllBytes($onnxPath, $bytes)
        Write-Host "Saved $name.onnx ($($bytes.Length) bytes)"
    } else {
        Write-Host "Already exists: $name.onnx"
    }

    if (-not (Test-Path $jsonPath)) {
        Write-Host "Downloading $name.onnx.json..."
        $url = "$baseurl.onnx.json"
        $bytes = $client.GetByteArrayAsync($url).Result
        [System.IO.File]::WriteAllBytes($jsonPath, $bytes)
        Write-Host "Saved $name.onnx.json ($($bytes.Length) bytes)"
    } else {
        Write-Host "Already exists: $name.onnx.json"
    }
}

Write-Host "All downloads complete!"
