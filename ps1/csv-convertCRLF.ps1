param(
    [string]$inputFile = ".\Result\input.csv",
    [string]$outputFile = ".\Result\Output.csv"
)

# 入力ファイルを読み込み (UTF-8)
$csvData = Import-Csv -Path $inputFile -Encoding UTF8

# 改行コードを半角スペースに置き換え
foreach ($row in $csvData) {
    foreach ($property in $row.PSObject.Properties) {
        $property.Value = $property.Value -replace '[\r\n]+', ' '
    }
}

# 出力ファイルにデータを書き込み (UTF-8)
$csvData | Export-Csv -Path $outputFile -Encoding "Shift-JIS" -NoTypeInformation

# 完了メッセージを表示
Write-Host "CSVファイル内の改行コードが半角スペースに置き換えられました。出力ファイル: $outputFile"
