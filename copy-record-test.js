const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

// 設定ファイルを読み込む
dotenv.config({path: "./secret/.env"});

// APIキーとデータベースIDを取得する
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Notion APIクライアントを初期化する
const notion = new Client({
  auth: NOTION_API_KEY,
});

// データベースの内容を取得する関数を定義する
async function getDatabaseContents() {
  try {
    // データベースを検索するクエリを実行する
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
    });

    // 検索結果の配列を取得する
    const databaseResults = response.results;
    databaseResults.forEach(record => {
      console.log('----------');
      Object.entries(record.properties).forEach(([key, value]) => {
        console.log(`${key}: ${JSON.stringify(value, null, 2)}`);
      });
      createNewDatabaseRecord(record);
    });

    // execCommand(databaseResults);

  } catch (error) {
    console.error(error);
  }
}

async function createNewDatabaseRecord(postObject) {
  postObject.parent.database_id = NOTION_DATABASE_ID;
  const response = await notion.pages.create(postObject);
  console.log(response);
}

// データベースの内容を取得する関数を呼び出す
getDatabaseContents();
// createNewDatabaseRecord();
