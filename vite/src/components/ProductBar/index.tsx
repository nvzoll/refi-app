import { isModalNewsAtom } from "@/atoms/ui";
import { Body, Header, Modal } from "@zendeskgarden/react-modals";
import React, { ReactElement } from "react";
import { useAtom } from "jotai";
import EscExit from "../EscExit";
import { appThemeAtom } from "@/atoms/ui.action";

const ProductBar = (): ReactElement => {
  const [isShowNews, setShowNews] = useAtom(isModalNewsAtom);
  const [appTheme, setAppTheme] = useAtom(appThemeAtom);

  return (
    <>
      <div className="flex flex-row items-center space-x-2 text-sm">
        <button
          onClick={() => setAppTheme(!appTheme)}
          className="flex flex-row items-center px-2 py-1 hover:bg-gray-300 dark:hover:bg-gray-700"
        >
          {!appTheme ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
              Light theme
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
              </svg>
              Dark theme
            </>
          )}
        </button>
        <button
          onClick={() => setShowNews(true)}
          className="px-2 py-1 hover:bg-gray-300 dark:hover:bg-gray-700"
        >
          🔥 What&apos;s new
        </button>
      </div>
      {isShowNews && (
        <EscExit onExit={() => setShowNews(false)}>
          <Modal
            isLarge
            focusOnMount
            isAnimated={false}
            backdropProps={{ onClick: () => setShowNews(false) }}
            className="w-10/12 h-5/6"
          >
            <Header>🔥 What&apos;s new </Header>
            <Body className="p-2">
              {/* // TODO: Add user_id to the url */}
              <iframe
                src="https://refi-changelog.super.site/"
                className="w-full h-full"
              />
            </Body>
          </Modal>
        </EscExit>
      )}
    </>
  );
};

export default ProductBar;
