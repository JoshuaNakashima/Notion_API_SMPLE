param(
    [string]$SourceFolder = ".\SourceFolder\",
    [string]$OutputFile = ".\Result\Merged.csv"
)

# ソースフォルダ内のCSVファイルを検索
$csvFiles = Get-ChildItem -Path $SourceFolder -Filter *.csv -Recurse

# 最初のCSVファイルのヘッダーを取得
$headers = Get-Content -Path $csvFiles[0].FullName -TotalCount 1

# 出力ファイルにヘッダーを書き込み
Set-Content -Path $OutputFile -Value $headers

# 各CSVファイルをマージ
foreach ($file in $csvFiles) {
    # ヘッダー以外のデータを取得
    $data = Get-Content -Path $file.FullName | Select-Object -Skip 1

    # 複数の改行文字（CR または LF）を1つの半角スペースに変換
    $data = $data -replace '[\r\n]+', ''

    # データを出力ファイルに追記
    Add-Content -Path $OutputFile -Value $data
}

# 完了メッセージを表示
Write-Host "CSVファイルがマージされました。出力ファイル: $OutputFile"
