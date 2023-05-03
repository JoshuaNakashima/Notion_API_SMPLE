const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

// 設定ファイルを読み込む
dotenv.config({path: "./secret/.env"});

// get masters
const masters = (() => {
  const fs = require('fs');
  // 外部ファイルからJSONを読み込む
  const jsonData = fs.readFileSync('./secret/masters.json');
  // JSONをオブジェクトにパースする
  const jsonObj = JSON.parse(jsonData);
  return jsonObj;
})();

// Notion APIクライアントを初期化する
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// データベースの内容を取得する関数を定義する
async function getDatabaseContents() {
  try {
    // データベースを検索するクエリを実行する
    const response = await notion.databases.query({
      // DBを共有して、そのIDを取得する。
      database_id: masters['本番用'],
    });

    // 検索結果の配列を取得する
    const databaseResults = response.results;
    databaseResults.forEach(record => {
      console.log(`${record.properties.氏名.formula.string}: ${record.properties.幕屋タグ.select.name}`);
      // dbIdを取得
      const makuyaId = masters[record.properties.幕屋タグ.select.name];
      // 更新
      // updateDatabaseRecord(record);
      // 計算プロパティを削除
      removeFormulaElements(record);
      // 登録先へコピー
      createNewDatabaseRecord(record, masters['バックアップ']);
      createNewDatabaseRecord(record, makuyaId);
    });

  } catch (error) {
    console.error(error);
  }
}

function removeFormulaElements(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      removeFormulaElements(obj[key]);
    }
    if (obj[key] && obj[key].type === 'formula') {
      delete obj[key];
    }
    if (obj[key] && (key === '作成日時' || key === '最終更新日時')) {
      delete obj[key];
    }
  }
}

async function createNewDatabaseRecord(postObject, dbId) {
  postObject.parent.database_id = dbId;
  const response = await notion.pages.create(postObject);
  console.log(response);
}

async function updateDatabaseRecord(record) {
  if (record.properties['データ移動']) {
    record.properties['データ移動'].date.start = Date.now();
  }
  const response = await notion.pages.update(record);
  console.log(response);
}

// データベースの内容を取得する関数を呼び出す
getDatabaseContents();
