"use client";

import { Settings, Server, Shield, Bell } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen">
      <Header title="Cài đặt" description="Cấu hình hệ thống" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Cài đặt chung
            </CardTitle>
            <CardDescription>Cấu hình chung cho hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Chế độ bảo trì</Label>
                <p className="text-sm text-muted-foreground">
                  Tạm dừng tất cả các yêu cầu chat
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Ghi log chi tiết</Label>
                <p className="text-sm text-muted-foreground">
                  Lưu log đầy đủ cho mục đích debug
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Bảo mật
            </CardTitle>
            <CardDescription>Cài đặt bảo mật hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Yêu cầu xác thực</Label>
                <p className="text-sm text-muted-foreground">
                  Bắt buộc đăng nhập để sử dụng chat
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Rate limiting</Label>
                <p className="text-sm text-muted-foreground">
                  Giới hạn số yêu cầu mỗi phút
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Thông báo
            </CardTitle>
            <CardDescription>Cài đặt thông báo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Thông báo lỗi</Label>
                <p className="text-sm text-muted-foreground">
                  Gửi email khi có lỗi nghiêm trọng
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Báo cáo hàng ngày</Label>
                <p className="text-sm text-muted-foreground">
                  Gửi báo cáo sử dụng hàng ngày
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
