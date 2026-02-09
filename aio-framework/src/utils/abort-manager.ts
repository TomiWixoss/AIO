/**
 * Abort Manager
 * Quản lý việc cancel requests và streams
 */

export class AbortManager {
  private controllers = new Map<string, AbortController>();

  /**
   * Tạo AbortController mới cho request
   */
  create(requestId: string): AbortController {
    const controller = new AbortController();
    this.controllers.set(requestId, controller);
    return controller;
  }

  /**
   * Lấy AbortController theo ID
   */
  get(requestId: string): AbortController | undefined {
    return this.controllers.get(requestId);
  }

  /**
   * Cancel request theo ID
   */
  cancel(requestId: string): boolean {
    const controller = this.controllers.get(requestId);
    if (controller) {
      controller.abort();
      this.controllers.delete(requestId);
      return true;
    }
    return false;
  }

  /**
   * Cleanup controller sau khi hoàn thành
   */
  cleanup(requestId: string): void {
    this.controllers.delete(requestId);
  }

  /**
   * Kiểm tra request có đang active không
   */
  isActive(requestId: string): boolean {
    return this.controllers.has(requestId);
  }

  /**
   * Lấy danh sách active requests
   */
  getActiveRequests(): string[] {
    return Array.from(this.controllers.keys());
  }

  /**
   * Cancel tất cả requests
   */
  cancelAll(): void {
    this.controllers.forEach((controller) => controller.abort());
    this.controllers.clear();
  }
}
