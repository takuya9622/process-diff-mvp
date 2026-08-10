import Link from "next/link";

import { createCasePath, createCommunicationPath } from "@/constants/routes";
import { formatWorkflowDateTime } from "@/lib/workflow-display";
import type { CommunicationWorkspaceData } from "@/types/communication";
import { ChannelCreateForm } from "./channel-create-form";
import { MessageComposer } from "./message-composer";

export function CommunicationWorkspace({
  organizationSlug,
  canMutate,
  data,
}: {
  organizationSlug: string;
  canMutate: boolean;
  data: CommunicationWorkspaceData;
}) {
  return (
    <div className="min-h-[46rem] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="border-b border-outline bg-surface-muted p-4 lg:border-r lg:border-b-0">
        <div className="flex items-start justify-between gap-3 lg:block">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-action-primary uppercase">
              コミュニケーション
            </p>
            <h1 className="mt-1 text-xl font-bold text-content-primary">
              チャンネル
            </h1>
          </div>
          <span className="rounded-full bg-change-added-bg px-2.5 py-1 text-[0.7rem] font-bold text-change-added-content">
            ネイティブ
          </span>
        </div>

        <nav aria-label="コミュニケーションチャンネル" className="mt-5">
          <ul className="space-y-1">
            {data.channels.map((channel) => {
              const active = channel.id === data.selectedChannel.id;
              return (
                <li key={channel.id}>
                  <Link
                    href={createCommunicationPath(organizationSlug, channel.id)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none ${
                      active
                        ? "bg-action-muted font-bold text-action-primary"
                        : "text-content-secondary hover:bg-surface-strong hover:text-content-primary"
                    }`}
                  >
                    <span className="min-w-0 truncate"># {channel.name}</span>
                    {channel.messageCount > 0 ? (
                      <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[0.65rem] font-bold text-content-tertiary">
                        {channel.messageCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {canMutate ? (
          <div className="mt-5">
            <ChannelCreateForm organizationSlug={organizationSlug} />
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-dashed border-outline-strong bg-surface px-3 py-3 text-xs leading-5 text-content-tertiary">
          Slack／Google
          Chatとの同期は後続。会話と案件共有は現在このアプリ内へ保存されます。
        </div>
      </aside>

      <section
        aria-labelledby="channel-title"
        className="flex min-w-0 flex-col"
      >
        <header className="border-b border-outline px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2
                id="channel-title"
                className="text-xl font-bold text-content-primary"
              >
                # {data.selectedChannel.name}
              </h2>
              <p className="mt-1 text-sm leading-6 text-content-secondary">
                {data.selectedChannel.description ||
                  "このチャンネルの説明はありません。"}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-status-info-bg px-3 py-1 text-xs font-bold text-status-info-content">
              {data.selectedChannel.messageCount}件のメッセージ
            </span>
          </div>
        </header>

        <div
          aria-live="polite"
          className="min-h-[26rem] flex-1 space-y-5 px-5 py-6 sm:px-6"
        >
          {data.messages.length > 0 ? (
            data.messages.map((message) => (
              <article key={message.id} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-action-muted text-sm font-black text-action-primary"
                >
                  {Array.from(message.authorDisplayName)[0] ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 className="text-sm font-bold text-content-primary">
                      {message.authorDisplayName}
                    </h3>
                    <time
                      dateTime={message.createdAt}
                      className="text-xs text-content-tertiary"
                    >
                      {formatWorkflowDateTime(message.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-content-secondary">
                    {message.body}
                  </p>
                  {message.relatedCase ? (
                    <Link
                      href={createCasePath(
                        organizationSlug,
                        message.relatedCase.id,
                      )}
                      className="mt-3 flex max-w-xl items-center justify-between gap-4 rounded-2xl border border-outline bg-surface-muted p-4 transition-colors hover:border-action-primary focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none"
                    >
                      <span>
                        <span className="block text-xs font-bold text-action-primary">
                          共有された案件 · {message.relatedCase.displayNumber}
                        </span>
                        <span className="mt-1 block text-sm font-bold text-content-primary">
                          {message.relatedCase.workflowName}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-status-info-bg px-3 py-1 text-xs font-bold text-status-info-content">
                        {message.relatedCase.statusLabel}
                      </span>
                    </Link>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="flex min-h-[22rem] items-center justify-center">
              <div className="max-w-md text-center">
                <span
                  aria-hidden="true"
                  className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-action-muted text-xl font-black text-action-primary"
                >
                  #
                </span>
                <h3 className="mt-4 font-bold text-content-primary">
                  まだメッセージはありません
                </h3>
                <p className="mt-2 text-sm leading-6 text-content-secondary">
                  最初の相談を投稿するか、進行中の案件を添付して確認を依頼できます。
                </p>
              </div>
            </div>
          )}
        </div>

        {canMutate ? (
          <MessageComposer
            organizationSlug={organizationSlug}
            channelId={data.selectedChannel.id}
            shareableCases={data.shareableCases}
          />
        ) : (
          <p className="border-t border-outline bg-surface-muted px-5 py-4 text-sm text-content-tertiary">
            閲覧者はメッセージを投稿できません。
          </p>
        )}
      </section>
    </div>
  );
}
