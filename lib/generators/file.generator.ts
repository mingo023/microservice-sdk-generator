import path from 'path';
import fs from 'fs';

export async function fileGenerator(location: string, content: string) {
    const folder = path.dirname(location);
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
    await fs.promises.writeFile(location, content);
}
