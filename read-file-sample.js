const fs = require('fs');

// 外部ファイルからJSONを読み込む
const jsonData = fs.readFileSync('masters.json');
// JSONをオブジェクトにパースする
const jsonObj = JSON.parse(jsonData);

// オブジェクトのキーのリストを取得する
const keys = Object.keys(jsonObj);
keys.forEach(key => {
    console.log(key); // ['本番用', 'バックアップ', '函館', '旭川', '札幌', '十勝']
});
console.log(keys); // ['本番用', 'バックアップ', '函館', '旭川', '札幌', '十勝']

/*
const masters = {
    "master1": 'sample',
};

console.log(masters["master1"]);
 */
