$zips = Get-ChildItem "templates\*.zip"
foreach ($zip in $zips) {
    $name = $zip.BaseName
    $suffix = "0"
    if ($name -match '\((\d+)\)') {
        $suffix = $matches[1]
    }
    $targetPath = "public\templates\template-regen-$suffix.png"
    $tempDir = "templates\temp_$($zip.Name)"
    
    Write-Host "Processing $($zip.Name) -> $targetPath"
    
    if (!(Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir | Out-Null
    }
    
    try {
        Expand-Archive -Path $zip.FullName -DestinationPath $tempDir -Force
        if (Test-Path "$tempDir\screen.png") {
            if (!(Test-Path "public\templates")) {
                New-Item -ItemType Directory -Path "public\templates" | Out-Null
            }
            Move-Item -Path "$tempDir\screen.png" -Destination $targetPath -Force
            Write-Host "Successfully extracted screen.png to $targetPath"
        } else {
            Write-Warning "screen.png not found in $($zip.Name)"
        }
    } catch {
        Write-Error "Failed to process $($zip.Name): $_"
    } finally {
        if (Test-Path $tempDir) {
            Remove-Item -Path $tempDir -Recurse -Force
        }
        Remove-Item -Path $zip.FullName -Force
        Write-Host "Deleted $($zip.Name)"
    }
}
