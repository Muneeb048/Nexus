const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTUyMmQwZWJmMTA1NTY0OGYyNWZiNCIsImlhdCI6MTc3OTc3MTU4NiwiZXhwIjoxNzgwMzc2Mzg2fQ.e80vXLiLLm1iuWAllXvIIstXcK1TTtrpo-oGPmH9FeU';
    
    const form = new FormData();
    form.append('document', fs.createReadStream('c:/Users/Muneeb/Desktop/Nexus/test_doc.txt'));
    
    const response = await axios.post('http://localhost:5000/api/documents/upload', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Upload Success:', response.data);
  } catch (error) {
    console.error('Upload Error:', error.response ? error.response.data : error.message);
  }
}

testUpload();
