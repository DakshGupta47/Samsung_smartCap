const jobId = 'ab2708edef1a43388a57c4a8be489d65';
const key = 'kiri_t6V8LerKHNyxdjJzUiEtjqTtSPJGFBYV0XWTA82ZZQ4';
const base = 'https://api.kiriengine.app/api/v1/open/model';

async function test(endpoint) {
  const res = await fetch(`${base}/${endpoint}?serialize=${jobId}`, {
     method: 'POST',
     headers: { Authorization: `Bearer ${key}` }
  });
  console.log(endpoint, res.status);
  const text = await res.text();
  console.log(text.substring(0, 200));
}

async function run() {
  await test('download-3d-models-zipped');
  await test('download');
  await test('download-model');
  await test('export');
  await test('getDownloadUrl');
}
run();
