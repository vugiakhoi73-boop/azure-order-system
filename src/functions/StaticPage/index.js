const fs = require('fs');
const path = require('path');

module.exports = async function (context, req) {
    const filename = context.bindingData.filename || 'index.html';
    const safeFilename = path.basename(filename);
    // Trỏ ra ngoài thư mục src/functions để tìm thư mục public ở gốc dự án
    const filePath = path.join(__dirname, '..', '..', 'public', safeFilename);

    if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
            const content = fs.readFileSync(filePath);
            
            let contentType = 'text/html';
            if (filePath.endsWith('.js')) contentType = 'application/javascript';
            else if (filePath.endsWith('.css')) contentType = 'text/css';
            else if (filePath.endsWith('.png')) contentType = 'image/png';
            else if (filePath.endsWith('.jpg')) contentType = 'image/jpeg';

            context.res = {
                status: 200,
                headers: { 'Content-Type': contentType },
                body: content
            };
            return;
        }
    }

    context.res = {
        status: 404,
        body: "Không tìm thấy trang yêu cầu!"
    };
};