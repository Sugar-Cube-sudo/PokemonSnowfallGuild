/**
 * 背景图片工具函数
 */

// 图片总数（根据public/imgs文件夹中的图片数量）
const TOTAL_IMAGES = 500; // 根据实际文件数量调整

/**
 * 获取随机背景图片URL
 * @returns 随机图片的URL
 */
export function getRandomBackgroundImage(): string {
  const randomNumber = Math.floor(Math.random() * TOTAL_IMAGES) + 1;
  return `/imgs/image_${randomNumber}.jpg`;
}

/**
 * 创建背景图片对象
 * @param url 图片URL
 * @param name 图片名称
 * @returns 背景图片对象
 */
export function createBackgroundImage(url: string, name?: string) {
  return {
    id: Date.now().toString(),
    url,
    name: name || `随机图片_${new Date().toLocaleTimeString()}`,
    uploadTime: new Date()
  };
}

/**
 * 获取初始随机背景图片
 * @returns 初始背景图片对象
 */
export function getInitialRandomBackground() {
  const url = getRandomBackgroundImage();
  return createBackgroundImage(url, '初始随机背景');
}