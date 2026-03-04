#!/usr/bin/env node

/**
 * Vercel 環境変数セットアップスクリプト
 * 
 * 使用方法:
 *   node setup-vercel-env.js
 * 
 * このスクリプトは以下の処理を行います:
 * 1. Vercel プロジェクトの確認
 * 2. 環境変数の登録（対話的）
 * 3. 環境変数の検証
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 環境変数定義
const ENVIRONMENT_VARS = {
  VITE_BACKEND_URL: {
    description: 'バックエンド API URL',
    example: 'https://api.jpyc-poikatsu.com',
    required: true,
  },
  VITE_GA_ID: {
    description: 'Google Analytics ID',
    example: 'G-XXXXXXXXXX',
    required: false,
  },
  VITE_SENTRY_DSN: {
    description: 'Sentry エラートラッキング DSN',
    example: 'https://xxxxx@xxxxx.ingest.sentry.io/xxxxxx',
    required: false,
  },
};

const BACKEND_VARS = {
  DATABASE_URL: {
    description: 'PostgreSQL 接続文字列',
    example: 'postgresql://user:password@host:5432/dbname',
    required: true,
  },
  REDIS_URL: {
    description: 'Redis 接続 URL',
    example: 'redis://localhost:6379',
    required: false,
  },
  JWT_SECRET: {
    description: 'JWT シークレット',
    example: '(32文字以上のランダムな文字列)',
    required: true,
  },
  RPC_URL: {
    description: 'Polygon RPC URL',
    example: 'https://polygon-rpc.com',
    required: true,
  },
  JPYC_CONTRACT_ADDRESS: {
    description: 'JPYC コントラクトアドレス',
    example: '0x...',
    required: false,
  },
  TRANSFER_PRIVATE_KEY: {
    description: 'ウォレット秘密鍵（Relayer用）',
    example: '0x...',
    required: true,
  },
};

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function checkVercelProject() {
  console.log('\n📋 Vercel プロジェクト確認...\n');

  try {
    const projectJson = path.join(__dirname, '.vercel', 'project.json');
    if (!fs.existsSync(projectJson)) {
      console.log(
        '⚠️  Vercel プロジェクトが未設定です。以下を実行してください:\n'
      );
      console.log('  vercel link\n');
      process.exit(1);
    }

    const project = JSON.parse(fs.readFileSync(projectJson, 'utf-8'));
    console.log(`✅ Vercel プロジェクト ID: ${project.projectId}`);
    console.log(`✅ 組織 ID: ${project.orgId}\n`);

    return { projectId: project.projectId, orgId: project.orgId };
  } catch (error) {
    console.error('❌ Vercel プロジェクト確認エラー:', error.message);
    process.exit(1);
  }
}

async function setupEnvironmentVariables() {
  console.log('\n🔐 フロントエンド環境変数をセットアップします\n');

  for (const [key, config] of Object.entries(ENVIRONMENT_VARS)) {
    const required = config.required ? '(必須)' : '(オプション)';
    const value = await question(
      `${key} ${required}\n説明: ${config.description}\n例: ${config.example}\n値: `
    );

    if (!value && config.required) {
      console.log(`❌ ${key} は必須です\n`);
      return setupEnvironmentVariables();
    }

    if (value) {
      try {
        console.log(`📝 Vercel に ${key} を登録中...\n`);
        execSync(`vercel env add ${key}`, {
          stdio: 'pipe',
          input: value,
        });
        console.log(`✅ ${key} を登録しました\n`);
      } catch (error) {
        console.error(`❌ ${key} 登録エラー:`, error.message);
      }
    }
  }
}

async function setupBackendVariables() {
  const useBackend = await question(
    '\n🚀 バックエンド環境変数もセットアップしますか？ [y/N]: '
  );

  if (useBackend.toLowerCase() !== 'y') {
    console.log('\n⏭️  バックエンド環境変数のセットアップをスキップしました');
    return;
  }

  console.log('\n🔐 バックエンド環境変数をセットアップします\n');

  for (const [key, config] of Object.entries(BACKEND_VARS)) {
    const required = config.required ? '(必須)' : '(オプション)';
    const value = await question(
      `${key} ${required}\n説明: ${config.description}\n例: ${config.example}\n値: `
    );

    if (!value && config.required) {
      console.log(`❌ ${key} は必須です\n`);
      return setupBackendVariables();
    }

    if (value) {
      try {
        console.log(`📝 Vercel に ${key} を登録中...\n`);
        execSync(`vercel env add ${key}`, {
          stdio: 'pipe',
          input: value,
        });
        console.log(`✅ ${key} を登録しました\n`);
      } catch (error) {
        console.error(`❌ ${key} 登録エラー:`, error.message);
      }
    }
  }
}

async function verifyEnvironmentVariables() {
  console.log('\n✔️  環境変数を検証しています...\n');

  try {
    const output = execSync('vercel env list', { encoding: 'utf-8' });
    console.log('📋 登録済み環境変数:\n');
    console.log(output);
  } catch (error) {
    console.error('❌ 環境変数確認エラー:', error.message);
  }
}

async function generateEnvLocalFile() {
  const useLocal = await question(
    '\n📝 ローカル開発用に .env.local を生成しますか？ [y/N]: '
  );

  if (useLocal.toLowerCase() !== 'y') {
    return;
  }

  const envLocalPath = path.join(__dirname, '.env.local');
  let envContent = '# ローカル開発環境変数\n';
  envContent += '# .env.example をコピーして .env.local にして編集してください\n\n';

  for (const [key] of Object.entries(ENVIRONMENT_VARS)) {
    envContent += `# ${key}=\n`;
  }

  try {
    fs.writeFileSync(envLocalPath, envContent);
    console.log(`✅ .env.local を生成しました: ${envLocalPath}\n`);
  } catch (error) {
    console.error('❌ .env.local 生成エラー:', error.message);
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Vercel 環境変数セットアップ          ║');
  console.log('╚════════════════════════════════════════╝\n');

  // プロジェクト確認
  const project = await checkVercelProject();

  // フロントエンド環境変数
  await setupEnvironmentVariables();

  // バックエンド環境変数
  await setupBackendVariables();

  // 環境変数検証
  await verifyEnvironmentVariables();

  // ローカル env ファイル生成
  await generateEnvLocalFile();

  // 完了
  console.log('\n✅ セットアップが完了しました！\n');
  console.log('次のステップ:');
  console.log('  1. vercel env pull --production  # 環境変数をローカルにプル');
  console.log('  2. vercel --prod                 # 本番環境にデプロイ');
  console.log('  3. https://vercel.com/dashboard  # ダッシュボードで確認\n');

  rl.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ エラー:', error.message);
  rl.close();
  process.exit(1);
});
