param(
    [string]$SourceFolder = ".",
    [string]$SearchString
)

Write-Host "START"

# ソースフォルダ内のCSVファイルを検索
$csvFiles = Get-ChildItem -Path $SourceFolder -Filter *.csv -Recurse

foreach ($file in $csvFiles) {
    $fileContent = Get-Content -Path $file.FullName -Encoding UTF8
    $lineNumber = 0

    foreach ($line in $fileContent) {
        $lineNumber++

        if ($line -like "*$SearchString*") {
            Write-Host "Found in $($file.FullName) at line $lineNumber"
            Write-Host $line
            Write-Host ""
        }
    }
}
