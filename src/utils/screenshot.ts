import html2canvas from 'html2canvas';

export async function captureElementToClipboard(elementId: string, teamName: string): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id ${elementId} not found`);
    }

    // 临时设置背景色，确保截图效果
    const originalBackground = element.style.background;
    const originalPadding = element.style.padding;
    element.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)';
    element.style.padding = '20px';

    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // 提高截图质量
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    // 恢复原始样式
    element.style.background = originalBackground;
    element.style.padding = originalPadding;

    // 将canvas转换为blob并复制到剪贴板
    canvas.toBlob(async (blob) => {
      if (!blob) {
        throw new Error('Failed to create blob from canvas');
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);

        // 显示成功提示
        showNotification(`${teamName}截图已保存到剪贴板！`, 'success');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);

        // 如果剪贴板API失败，则下载图片
        downloadImage(canvas, `${teamName}_${new Date().getTime()}.png`);
      }
    });

  } catch (error) {
    console.error('Screenshot failed:', error);
    showNotification('截图失败，请重试', 'error');
  }
}

function downloadImage(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL();
  link.click();
}

function showNotification(message: string, type: 'success' | 'error'): void {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#4caf50' : '#f44336'};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease-out;
  `;

  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // 3秒后自动移除
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}