/**
 * 日志控制器 - 仅开发环境可用
 * 提供日志文件查看、搜索和清理功能
 */
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { LOG_DIR } from '../utils/logger';

class LogsController {
  /**
   * 获取日志文件列表
   * GET /api/logs
   */
  async listLogs(_req: Request, res: Response): Promise<void> {
    try {
      if (!fs.existsSync(LOG_DIR)) {
        res.json({
          success: true,
          data: {
            directory: LOG_DIR,
            files: [],
            totalFiles: 0,
            totalSize: '0 MB',
          },
        });
        return;
      }

      const files = fs.readdirSync(LOG_DIR)
        .filter(f => f.endsWith('.log') || f.endsWith('.gz'))
        .map(filename => {
          const filePath = path.join(LOG_DIR, filename);
          const stats = fs.statSync(filePath);
          return {
            filename,
            size: `${(stats.size / 1024).toFixed(2)} KB`,
            sizeBytes: stats.size,
            modified: stats.mtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

      const totalSize = files.reduce((sum, f) => sum + f.sizeBytes, 0);

      res.json({
        success: true,
        data: {
          directory: LOG_DIR,
          files,
          totalFiles: files.length,
          totalSize: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'LOG_READ_ERROR', message: '无法读取日志目录' },
      });
    }
  }

  /**
   * 获取日志文件内容（尾部 N 行）
   * GET /api/logs/:filename?lines=100
   */
  async getLogContent(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const lines = Math.min(parseInt(req.query.lines as string) || 100, 1000);
      const filePath = path.join(LOG_DIR, filename);

      // 安全检查：防止路径遍历
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(path.normalize(LOG_DIR)) || filename.includes('..')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PATH', message: '无效的文件路径' },
        });
        return;
      }

      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          error: { code: 'FILE_NOT_FOUND', message: '日志文件不存在' },
        });
        return;
      }

      // 读取文件最后 N 行
      const content = await this.readLastLines(filePath, lines);

      res.json({
        success: true,
        data: {
          filename,
          lines: content.length,
          content,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'LOG_READ_ERROR', message: '无法读取日志文件' },
      });
    }
  }

  /**
   * 搜索日志
   * GET /api/logs/search?keyword=error&file=combined&limit=50
   */
  async searchLogs(req: Request, res: Response): Promise<void> {
    try {
      const { keyword, file } = req.query;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

      if (!keyword) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_KEYWORD', message: '请提供搜索关键词' },
        });
        return;
      }

      if (!fs.existsSync(LOG_DIR)) {
        res.json({
          success: true,
          data: { keyword, total: 0, results: [] },
        });
        return;
      }

      const files = fs.readdirSync(LOG_DIR)
        .filter(f => f.endsWith('.log'))
        .filter(f => !file || f.includes(file as string));

      const results: Array<{ file: string; line: number; content: string }> = [];
      const keywordLower = (keyword as string).toLowerCase();

      for (const filename of files) {
        const filePath = path.join(LOG_DIR, filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(keywordLower) && results.length < limit) {
            results.push({
              file: filename,
              line: index + 1,
              content: line.substring(0, 500),
            });
          }
        });

        if (results.length >= limit) break;
      }

      res.json({
        success: true,
        data: {
          keyword,
          total: results.length,
          results,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'SEARCH_ERROR', message: '搜索失败' },
      });
    }
  }

  /**
   * 清理旧日志
   * DELETE /api/logs/cleanup?days=7
   */
  async cleanupLogs(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

      if (!fs.existsSync(LOG_DIR)) {
        res.json({
          success: true,
          data: {
            message: `日志目录不存在`,
            deletedFiles: [],
            deletedCount: 0,
          },
        });
        return;
      }

      const files = fs.readdirSync(LOG_DIR);
      const deleted: string[] = [];

      for (const filename of files) {
        if (filename === '.gitkeep') continue;

        const filePath = path.join(LOG_DIR, filename);
        const stats = fs.statSync(filePath);

        if (stats.mtime.getTime() < cutoff) {
          fs.unlinkSync(filePath);
          deleted.push(filename);
        }
      }

      res.json({
        success: true,
        data: {
          message: `已清理 ${days} 天前的日志`,
          deletedFiles: deleted,
          deletedCount: deleted.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'CLEANUP_ERROR', message: '清理失败' },
      });
    }
  }

  /**
   * 辅助方法：读取文件最后 N 行
   */
  private readLastLines(filePath: string, n: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const lines: string[] = [];
      const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
      const rl = readline.createInterface({ input: stream });

      rl.on('line', (line) => {
        lines.push(line);
        if (lines.length > n) lines.shift();
      });

      rl.on('close', () => resolve(lines));
      rl.on('error', reject);
    });
  }
}

export default new LogsController();
