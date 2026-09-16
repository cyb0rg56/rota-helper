import { Link, router } from "expo-router";
import { useState } from "react";
import { ActionSheetIOS, Pressable, View } from "react-native";

import { Icon } from "@/components/icon";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Staff } from "@/types";
import { blurActiveElement } from "@/utils/focus";

function getAvatarTextColor(backgroundColor: string) {
  const hex = backgroundColor.replace("#", "");
  if (hex.length !== 6) {
    return "#fff";
  }
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.15;
  return darkContrast >= whiteContrast ? "#1a1a2e" : "#fff";
}

export function StaffRow({
  staffMember,
  onDelete,
  isFirst = true,
  isLast = true,
}: {
  staffMember: Staff;
  onDelete: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const isDark = useColorScheme() === "dark";
  const isIOS = process.env.EXPO_OS === "ios";
  const [isMainRowPressed, setIsMainRowPressed] = useState(false);
  const avatarTextColor = getAvatarTextColor(staffMember.color);
  const editStaff = () => {
    blurActiveElement();
    router.push({ pathname: "/edit-staff", params: { id: staffMember.id } });
  };
  const showActions = () => {
    if (process.env.EXPO_OS !== "ios") {
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Cancel", "Edit", "Delete"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 2,
        title: staffMember.name,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          editStaff();
        } else if (buttonIndex === 2) {
          onDelete();
        }
      },
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        borderRadius: isIOS ? 0 : 16,
        borderTopLeftRadius: isIOS ? (isFirst ? 16 : 0) : 16,
        borderTopRightRadius: isIOS ? (isFirst ? 16 : 0) : 16,
        borderBottomLeftRadius: isIOS ? (isLast ? 16 : 0) : 16,
        borderBottomRightRadius: isIOS ? (isLast ? 16 : 0) : 16,
        borderCurve: "continuous",
        overflow: "hidden",
        backgroundColor: isDark ? "#2d2d44" : "#fff",
        borderWidth: 1,
        borderTopWidth: isIOS && !isFirst ? 0 : 1,
        borderColor: isDark ? "#3a3a5a" : "#e8eaed",
        boxShadow: isIOS ? undefined : "0 1px 2px rgba(0, 0, 0, 0.05)",
      }}
    >
      <View style={{ flex: 1 }}>
        <Link
          href={{ pathname: "/edit-staff", params: { id: staffMember.id } }}
          asChild
          onPress={blurActiveElement}
        >
          <Link.Trigger>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${staffMember.name}`}
              android_ripple={{ color: "rgba(78,205,196,0.16)" }}
              onPressIn={() => setIsMainRowPressed(true)}
              onPressOut={() => setIsMainRowPressed(false)}
              style={{
                flex: 1,
                minHeight: 76,
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingLeft: 16,
                paddingRight: 10,
                gap: 14,
                opacity: isMainRowPressed ? 0.7 : 1,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: staffMember.color,
                }}
              >
                <ThemedText
                  style={{
                    color: avatarTextColor,
                    fontSize: 17,
                    fontWeight: "700",
                  }}
                >
                  {staffMember.name.trim().charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText
                  selectable
                  style={{ fontSize: 17, fontWeight: "600" }}
                >
                  {staffMember.name}
                </ThemedText>
                {staffMember.role ? (
                  <ThemedText selectable style={{ fontSize: 14, opacity: 0.7 }}>
                    {staffMember.role}
                  </ThemedText>
                ) : null}
                {staffMember.email ? (
                  <ThemedText selectable style={{ fontSize: 12, opacity: 0.5 }}>
                    {staffMember.email}
                  </ThemedText>
                ) : null}
              </View>
              {isIOS ? (
                <Icon
                  sf="chevron.right"
                  md="chevron-right"
                  size={20}
                  color={isDark ? "#888" : "#a0a5ab"}
                />
              ) : null}
            </Pressable>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction
              icon="pencil"
              onPress={() => {
                blurActiveElement();
                router.push({
                  pathname: "/edit-staff",
                  params: { id: staffMember.id },
                });
              }}
            >
              Edit
            </Link.MenuAction>
            <Link.MenuAction icon="trash" destructive onPress={onDelete}>
              Delete
            </Link.MenuAction>
          </Link.Menu>
        </Link>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderLeftWidth: 1,
          borderLeftColor: isDark ? "#3a3a5a" : "#e8eaed",
        }}
      >
        {process.env.EXPO_OS === "ios" ? (
          <Pressable
            onPress={showActions}
            accessibilityRole="button"
            accessibilityLabel={`More actions for ${staffMember.name}`}
            android_ripple={{ color: "rgba(83,109,254,0.16)" }}
            style={({ pressed }) => ({
              minWidth: 52,
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.55 : 1,
            })}
          >
            <Icon
              sf="ellipsis"
              md="dots-horizontal"
              size={22}
              color={isDark ? "#b8c4ff" : "#536dfe"}
            />
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={editStaff}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${staffMember.name}`}
              android_ripple={{ color: "rgba(83,109,254,0.16)" }}
              style={({ pressed }) => ({
                minWidth: 48,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.55 : 1,
              })}
            >
              <Icon
                sf="pencil"
                md="pencil-outline"
                size={21}
                color={isDark ? "#b8c4ff" : "#536dfe"}
              />
            </Pressable>
            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${staffMember.name}`}
              android_ripple={{ color: "rgba(255,59,48,0.16)" }}
              style={({ pressed }) => ({
                minWidth: 48,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.55 : 1,
              })}
            >
              <Icon
                sf="trash"
                md="trash-can-outline"
                size={21}
                color="#FF3B30"
              />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
