import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RoomImageGallery } from "@/app/dashboard/spaces/[id]/room-detail-image";
import type { Room } from "@/utils/supabase/queries";

function room(overrides: Partial<Room> = {}): Room {
  return {
    id: overrides.id ?? "room-1",
    name: overrides.name ?? "Seminar Room",
    room_code: overrides.room_code ?? "101",
    capacity: overrides.capacity ?? 40,
    unavailable_periods: overrides.unavailable_periods ?? null,
    equipment: overrides.equipment ?? [],
    floor: overrides.floor ?? "1F",
    room_type: overrides.room_type ?? "Meeting",
    image_url: overrides.image_url ?? null,
    image_urls: overrides.image_urls ?? null,
    is_active: overrides.is_active ?? true,
    allow_noon: overrides.allow_noon ?? true,
    admin_only: overrides.admin_only ?? false,
  };
}

describe("RoomImageGallery", () => {
  it("renders the selected primary image as the main image", () => {
    render(
      <RoomImageGallery
        room={room({
          image_url: "/cover.jpg",
          image_urls: ["/side.jpg", "/cover.jpg", "/back.jpg"],
        })}
      />,
    );

    expect(screen.getByAltText("Seminar Room")).toHaveAttribute(
      "src",
      expect.stringContaining("cover.jpg"),
    );
  });

  it("renders remaining gallery images as thumbnails", () => {
    render(
      <RoomImageGallery
        room={room({
          image_url: "/cover.jpg",
          image_urls: ["/cover.jpg", "/side.jpg", "/back.jpg"],
        })}
      />,
    );

    expect(screen.getByLabelText("查看 Seminar Room 圖片 2")).toBeInTheDocument();
    expect(screen.getByLabelText("查看 Seminar Room 圖片 3")).toBeInTheDocument();
  });

  it("opens a large preview and closes when the blank overlay is clicked", async () => {
    const user = userEvent.setup();

    render(
      <RoomImageGallery
        room={room({
          image_url: "/cover.jpg",
          image_urls: ["/cover.jpg", "/side.jpg"],
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seminar Room" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByAltText("Seminar Room 大圖預覽")).toHaveAttribute(
      "src",
      expect.stringContaining("cover.jpg"),
    );

    const overlay = document.querySelector("[data-slot='dialog-overlay']");
    expect(overlay).toBeTruthy();
    fireEvent.pointerDown(overlay as Element);
    fireEvent.click(overlay as Element);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
