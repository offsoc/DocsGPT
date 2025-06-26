import 'katex/dist/katex.min.css';

import { forwardRef, Fragment, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneLight,
  vscDarkPlus,
} from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import DocumentationDark from '../assets/documentation-dark.svg';
import ChevronDown from '../assets/chevron-down.svg';
import Cloud from '../assets/cloud.svg';
import DocsGPT3 from '../assets/cute_docsgpt3.svg';
import Dislike from '../assets/dislike.svg?react';
import Document from '../assets/document.svg';
import Edit from '../assets/edit.svg';
import Like from '../assets/like.svg?react';
import Link from '../assets/link.svg';
import Sources from '../assets/sources.svg';
import UserIcon from '../assets/user.svg';
import Accordion from '../components/Accordion';
import Avatar from '../components/Avatar';
import CopyButton from '../components/CopyButton';
import MermaidRenderer from '../components/MermaidRenderer';
import Sidebar from '../components/Sidebar';
import Spinner from '../components/Spinner';
import SpeakButton from '../components/TextToSpeechButton';
import { useDarkTheme, useOutsideAlerter } from '../hooks';
import {
  selectChunks,
  selectSelectedDocs,
} from '../preferences/preferenceSlice';
import classes from './ConversationBubble.module.css';
import { FEEDBACK, MESSAGE_TYPE } from './conversationModels';
import { ToolCallsType } from './types';

const DisableSourceFE = import.meta.env.VITE_DISABLE_SOURCE_FE || false;

const ConversationBubble = forwardRef<
  HTMLDivElement,
  {
    message?: string;
    type: MESSAGE_TYPE;
    className?: string;
    feedback?: FEEDBACK;
    handleFeedback?: (feedback: FEEDBACK) => void;
    thought?: string;
    sources?: { title: string; text: string; link: string }[];
    toolCalls?: ToolCallsType[];
    retryBtn?: React.ReactElement;
    questionNumber?: number;
    isStreaming?: boolean;
    handleUpdatedQuestionSubmission?: (
      updatedquestion?: string,
      updated?: boolean,
      index?: number,
    ) => void;
    filesAttached?: { id: string; fileName: string }[];
  }
>(function ConversationBubble(
  {
    message,
    type,
    className,
    feedback,
    handleFeedback,
    thought,
    sources,
    toolCalls,
    retryBtn,
    questionNumber,
    isStreaming,
    handleUpdatedQuestionSubmission,
    filesAttached,
  },
  ref,
) {
  const { t } = useTranslation();
  const [isDarkTheme] = useDarkTheme();
  // const bubbleRef = useRef<HTMLDivElement | null>(null);
  const chunks = useSelector(selectChunks);
  const selectedDocs = useSelector(selectSelectedDocs);
  const [isLikeHovered, setIsLikeHovered] = useState(false);
  const [isEditClicked, setIsEditClicked] = useState(false);
  const [isDislikeHovered, setIsDislikeHovered] = useState(false);
  const [isQuestionHovered, setIsQuestionHovered] = useState(false);
  const [editInputBox, setEditInputBox] = useState<string>('');
  const messageRef = useRef<HTMLDivElement>(null);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const [isLikeClicked, setIsLikeClicked] = useState(false);
  const [isDislikeClicked, setIsDislikeClicked] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const editableQueryRef = useRef<HTMLDivElement>(null);
  const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(true);

  useOutsideAlerter(editableQueryRef, () => setIsEditClicked(false), [], true);

  useEffect(() => {
    if (messageRef.current) {
      const height = messageRef.current.scrollHeight;
      setShouldShowToggle(height > 84);
    }
  }, [message]);

  const handleEditClick = () => {
    setIsEditClicked(false);
    handleUpdatedQuestionSubmission?.(editInputBox, true, questionNumber);
  };
  let bubble;
  if (type === 'QUESTION') {
    bubble = (
      <div
        onMouseEnter={() => setIsQuestionHovered(true)}
        onMouseLeave={() => setIsQuestionHovered(false)}
        className={className}
      >
        <div className="flex flex-col items-end">
          {filesAttached && filesAttached.length > 0 && (
            <div className="mb-4 mr-12 flex flex-wrap justify-end gap-2">
              {filesAttached.map((file, index) => (
                <div
                  key={index}
                  title={file.fileName}
                  className="flex items-center rounded-xl bg-[#EFF3F4] p-2 text-[14px] text-[#5D5D5D] dark:bg-[#393B3D] dark:text-bright-gray"
                >
                  <div className="mr-2 items-center justify-center rounded-lg bg-purple-30 p-[5.5px]">
                    <img
                      src={DocumentationDark}
                      alt="Attachment"
                      className="h-[15px] w-[15px] object-fill"
                    />
                  </div>
                  <span className="max-w-[150px] truncate font-normal">
                    {file.fileName}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div
            ref={ref}
            className={`flex flex-row-reverse justify-items-start`}
          >
            <Avatar
              size="SMALL"
              className="mt-2 flex-shrink-0 text-2xl"
              avatar={
                <img className="mr-1 rounded-full" width={30} src={UserIcon} />
              }
            />
            {!isEditClicked && (
              <>
                <div className="relative mr-2 flex w-full flex-col">
                  <div className="ml-2 mr-2 flex max-w-full items-start gap-2 whitespace-pre-wrap break-words rounded-[28px] bg-gradient-to-b from-medium-purple to-slate-blue px-5 py-4 text-sm leading-normal text-white sm:text-base">
                    <div
                      ref={messageRef}
                      className={`${isQuestionCollapsed ? 'line-clamp-4' : ''} w-full`}
                    >
                      {message}
                    </div>
                    {shouldShowToggle && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsQuestionCollapsed(!isQuestionCollapsed);
                        }}
                        className="ml-1 rounded-full p-2 hover:bg-[#D9D9D933]"
                      >
                        <img
                          src={ChevronDown}
                          alt="Toggle"
                          width={24}
                          height={24}
                          className={`transform invert transition-transform duration-200 ${isQuestionCollapsed ? '' : 'rotate-180'}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsEditClicked(true);
                    setEditInputBox(message ?? '');
                  }}
                  className={`mt-3 flex h-fit flex-shrink-0 cursor-pointer items-center rounded-full p-2 hover:bg-light-silver dark:hover:bg-[#35363B] ${isQuestionHovered || isEditClicked ? 'visible' : 'invisible'}`}
                >
                  <img src={Edit} alt="Edit" className="cursor-pointer" />
                </button>
              </>
            )}
          </div>
          {isEditClicked && (
            <div
              ref={editableQueryRef}
              className="mx-auto flex w-full flex-col gap-4 rounded-lg bg-transparent p-4"
            >
              <textarea
                placeholder={t('conversation.edit.placeholder')}
                onChange={(e) => {
                  setEditInputBox(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEditClick();
                  }
                }}
                rows={5}
                value={editInputBox}
                className="w-full resize-none rounded-3xl border border-silver px-4 py-3 text-base leading-relaxed text-carbon focus:outline-none dark:border-philippine-grey dark:bg-raisin-black dark:text-chinese-white"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  className="rounded-full px-4 py-2 text-sm font-semibold text-purple-30 transition-colors hover:bg-gainsboro hover:text-chinese-black-2 dark:hover:bg-onyx-2 dark:hover:text-[#B9BCBE]"
                  onClick={() => setIsEditClicked(false)}
                >
                  {t('conversation.edit.cancel')}
                </button>
                <button
                  className="rounded-full bg-purple-30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violets-are-blue dark:hover:bg-royal-purple"
                  onClick={handleEditClick}
                >
                  {t('conversation.edit.update')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    const preprocessLaTeX = (content: string) => {
      // Replace block-level LaTeX delimiters \[ \] with $$ $$
      const blockProcessedContent = content.replace(
        /\\\[(.*?)\\\]/gs,
        (_, equation) => `$$${equation}$$`,
      );

      // Replace inline LaTeX delimiters \( \) with $ $
      const inlineProcessedContent = blockProcessedContent.replace(
        /\\\((.*?)\\\)/gs,
        (_, equation) => `$${equation}$`,
      );

      return inlineProcessedContent;
    };
    const processMarkdownContent = (content: string) => {
      const processedContent = preprocessLaTeX(content);

      const contentSegments: Array<{
        type: 'text' | 'mermaid';
        content: string;
      }> = [];

      let lastIndex = 0;
      const regex = /```mermaid\n([\s\S]*?)```/g;
      let match;

      while ((match = regex.exec(processedContent)) !== null) {
        const textBefore = processedContent.substring(lastIndex, match.index);
        if (textBefore) {
          contentSegments.push({ type: 'text', content: textBefore });
        }

        contentSegments.push({ type: 'mermaid', content: match[1].trim() });

        lastIndex = match.index + match[0].length;
      }

      const textAfter = processedContent.substring(lastIndex);
      if (textAfter) {
        contentSegments.push({ type: 'text', content: textAfter });
      }

      return contentSegments;
    };
    bubble = (
      <div
        ref={ref}
        className={`flex flex-wrap self-start ${className} group flex-col dark:text-bright-gray`}
      >
        {DisableSourceFE ||
        type === 'ERROR' ||
        sources?.length === 0 ||
        sources?.some((source) => source.link === 'None')
          ? null
          : sources && (
              <div className="mb-4 flex flex-col flex-wrap items-start self-start lg:flex-nowrap">
                <div className="my-2 flex flex-row items-center justify-center gap-3">
                  <Avatar
                    className="h-[26px] w-[30px] text-xl"
                    avatar={
                      <img
                        src={Sources}
                        alt={t('conversation.sources.title')}
                        className="h-full w-full object-fill"
                      />
                    }
                  />
                  <p className="text-base font-semibold">
                    {t('conversation.sources.title')}
                  </p>
                </div>
                <div className="fade-in ml-3 mr-5 max-w-[90vw] md:max-w-[70vw] lg:max-w-[50vw]">
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {sources?.slice(0, 3)?.map((source, index) => (
                      <div key={index} className="relative">
                        <div
                          className="h-28 cursor-pointer rounded-[20px] bg-gray-1000 p-4 hover:bg-[#F1F1F1] dark:bg-gun-metal dark:hover:bg-[#2C2E3C]"
                          onMouseOver={() => setActiveTooltip(index)}
                          onMouseOut={() => setActiveTooltip(null)}
                        >
                          <p className="ellipsis-text h-12 break-words text-xs">
                            {source.text}
                          </p>
                          <div
                            className={`mt-[14px] flex flex-row items-center gap-[6px] underline-offset-2 ${
                              source.link && source.link !== 'local'
                                ? 'hover:text-[#007DFF] hover:underline dark:hover:text-[#48A0FF]'
                                : ''
                            }`}
                            onClick={() =>
                              source.link && source.link !== 'local'
                                ? window.open(
                                    source.link,
                                    '_blank',
                                    'noopener, noreferrer',
                                  )
                                : null
                            }
                          >
                            <img
                              src={Document}
                              alt="Document"
                              className="h-[17px] w-[17px] object-fill"
                            />
                            <p
                              className="mt-[2px] truncate text-xs"
                              title={
                                source.link && source.link !== 'local'
                                  ? source.link
                                  : source.title
                              }
                            >
                              {source.link && source.link !== 'local'
                                ? source.link
                                : source.title}
                            </p>
                          </div>
                        </div>
                        {activeTooltip === index && (
                          <div
                            className={`absolute left-1/2 z-50 max-h-48 w-40 translate-x-[-50%] translate-y-[3px] rounded-xl bg-[#FBFBFB] p-4 text-black shadow-xl dark:bg-chinese-black dark:text-chinese-silver sm:w-56`}
                            onMouseOver={() => setActiveTooltip(index)}
                            onMouseOut={() => setActiveTooltip(null)}
                          >
                            <p className="line-clamp-6 max-h-[164px] overflow-hidden text-ellipsis break-words rounded-md text-sm">
                              {source.text}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {(sources?.length ?? 0) > 3 && (
                      <div
                        className="flex h-28 cursor-pointer flex-col-reverse rounded-[20px] bg-gray-1000 p-4 text-purple-30 hover:bg-[#F1F1F1] hover:text-[#6D3ECC] dark:bg-gun-metal dark:hover:bg-[#2C2E3C] dark:hover:text-[#8C67D7]"
                        onClick={() => setIsSidebarOpen(true)}
                      >
                        <p className="ellipsis-text h-22 text-xs">
                          {t('conversation.sources.view_more', {
                            count: sources?.length ? sources.length - 3 : 0,
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
        {toolCalls && toolCalls.length > 0 && (
          <ToolCalls toolCalls={toolCalls} />
        )}
        {thought && (
          <Thought thought={thought} preprocessLaTeX={preprocessLaTeX} />
        )}
        {message && (
          <div className="flex max-w-full flex-col flex-wrap items-start self-start lg:flex-nowrap">
            <div className="my-2 flex flex-row items-center justify-center gap-3">
              <Avatar
                className="h-[34px] w-[34px] text-2xl"
                avatar={
                  <img
                    src={DocsGPT3}
                    alt={t('conversation.answer')}
                    className="h-full w-full object-cover"
                  />
                }
              />
              <p className="text-base font-semibold">
                {t('conversation.answer')}
              </p>
            </div>
            <div
              className={`fade-in-bubble mr-5 flex max-w-full rounded-[28px] bg-gray-1000 px-7 py-[18px] dark:bg-gun-metal ${
                type === 'ERROR'
                  ? 'relative flex-row items-center rounded-full border border-transparent bg-[#FFE7E7] p-2 py-5 text-sm font-normal text-red-3000 dark:border-red-2000 dark:text-white'
                  : 'flex-col rounded-3xl'
              }`}
            >
              {(() => {
                const contentSegments = processMarkdownContent(message);
                return (
                  <>
                    {contentSegments.map((segment, index) => (
                      <Fragment key={index}>
                        {segment.type === 'text' ? (
                          <ReactMarkdown
                            className="fade-in whitespace-pre-wrap break-words leading-normal"
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              code(props) {
                                const {
                                  children,
                                  className,
                                  node,
                                  ref,
                                  ...rest
                                } = props;
                                const match = /language-(\w+)/.exec(
                                  className || '',
                                );
                                const language = match ? match[1] : '';

                                return match ? (
                                  <div className="group relative overflow-hidden rounded-[14px] border border-light-silver dark:border-raisin-black">
                                    <div className="flex items-center justify-between bg-platinum px-2 py-1 dark:bg-eerie-black-2">
                                      <span className="text-xs font-medium text-just-black dark:text-chinese-white">
                                        {language}
                                      </span>
                                      <CopyButton
                                        textToCopy={String(children).replace(
                                          /\n$/,
                                          '',
                                        )}
                                      />
                                    </div>
                                    <SyntaxHighlighter
                                      {...rest}
                                      PreTag="div"
                                      language={language}
                                      style={
                                        isDarkTheme ? vscDarkPlus : oneLight
                                      }
                                      className="!mt-0"
                                      customStyle={{
                                        margin: 0,
                                        borderRadius: 0,
                                        scrollbarWidth: 'thin',
                                      }}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code className="whitespace-pre-line rounded-[6px] bg-gray-200 px-[8px] py-[4px] text-xs font-normal dark:bg-independence dark:text-bright-gray">
                                    {children}
                                  </code>
                                );
                              },
                              ul({ children }) {
                                return (
                                  <ul
                                    className={`list-inside list-disc whitespace-normal pl-4 ${classes.list}`}
                                  >
                                    {children}
                                  </ul>
                                );
                              },
                              ol({ children }) {
                                return (
                                  <ol
                                    className={`list-inside list-decimal whitespace-normal pl-4 ${classes.list}`}
                                  >
                                    {children}
                                  </ol>
                                );
                              },
                              table({ children }) {
                                return (
                                  <div className="relative overflow-x-auto rounded-lg border border-silver/40 dark:border-silver/40">
                                    <table className="w-full text-left text-gray-700 dark:text-bright-gray">
                                      {children}
                                    </table>
                                  </div>
                                );
                              },
                              thead({ children }) {
                                return (
                                  <thead className="bg-gray-50 text-xs uppercase text-gray-900 dark:bg-[#26272E]/50 dark:text-bright-gray">
                                    {children}
                                  </thead>
                                );
                              },
                              tr({ children }) {
                                return (
                                  <tr className="border-b border-gray-200 odd:bg-white even:bg-gray-50 dark:border-silver/40 dark:odd:bg-[#26272E] dark:even:bg-[#26272E]/50">
                                    {children}
                                  </tr>
                                );
                              },
                              th({ children }) {
                                return (
                                  <th className="px-6 py-3">{children}</th>
                                );
                              },
                              td({ children }) {
                                return (
                                  <td className="px-6 py-3">{children}</td>
                                );
                              },
                            }}
                          >
                            {segment.content}
                          </ReactMarkdown>
                        ) : (
                          <div
                            className="my-4 w-full"
                            style={{ minWidth: '100%' }}
                          >
                            <MermaidRenderer
                              code={segment.content}
                              isLoading={isStreaming}
                            />
                          </div>
                        )}
                      </Fragment>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        )}
        {message && (
          <div className="my-2 ml-2 flex justify-start">
            <div
              className={`relative mr-2 block items-center justify-center lg:invisible ${type !== 'ERROR' ? 'group-hover:lg:visible' : 'hidden'}`}
            >
              <div>
                <CopyButton textToCopy={message} />
              </div>
            </div>
            <div
              className={`relative mr-2 block items-center justify-center lg:invisible ${type !== 'ERROR' ? 'group-hover:lg:visible' : 'hidden'}`}
            >
              <div>
                <SpeakButton text={message} />
              </div>
            </div>
            {type === 'ERROR' && (
              <div className="relative mr-2 block items-center justify-center">
                <div>{retryBtn}</div>
              </div>
            )}
            {handleFeedback && (
              <>
                <div
                  className={`relative mr-2 flex items-center justify-center ${
                    feedback === 'LIKE' || isLikeClicked
                      ? 'visible'
                      : 'lg:invisible'
                  } ${type !== 'ERROR' ? 'group-hover:lg:visible' : ''} ${feedback === 'DISLIKE' && type !== 'ERROR' ? 'hidden' : ''}`}
                >
                  <div>
                    <div
                      className={`flex items-center justify-center rounded-full p-2 ${
                        isLikeHovered
                          ? 'bg-[#EEEEEE] dark:bg-purple-taupe'
                          : 'bg-[#ffffff] dark:bg-transparent'
                      }`}
                    >
                      <Like
                        className={`cursor-pointer ${
                          isLikeClicked || feedback === 'LIKE'
                            ? 'fill-white-3000 stroke-purple-30 dark:fill-transparent'
                            : 'fill-none stroke-gray-4000'
                        }`}
                        onClick={() => {
                          if (feedback === undefined || feedback === null) {
                            handleFeedback?.('LIKE');
                            setIsLikeClicked(true);
                            setIsDislikeClicked(false);
                          } else if (feedback === 'LIKE') {
                            handleFeedback?.(null);
                            setIsLikeClicked(false);
                            setIsDislikeClicked(false);
                          }
                        }}
                        onMouseEnter={() => setIsLikeHovered(true)}
                        onMouseLeave={() => setIsLikeHovered(false)}
                      ></Like>
                    </div>
                  </div>
                </div>

                <div
                  className={`relative mr-2 flex items-center justify-center ${
                    feedback === 'DISLIKE' || isLikeClicked
                      ? 'visible'
                      : 'lg:invisible'
                  } ${type !== 'ERROR' ? 'group-hover:lg:visible' : ''} ${feedback === 'LIKE' && type !== 'ERROR' ? 'hidden' : ''}`}
                >
                  <div>
                    <div
                      className={`flex items-center justify-center rounded-full p-2 ${
                        isDislikeHovered
                          ? 'bg-[#EEEEEE] dark:bg-purple-taupe'
                          : 'bg-[#ffffff] dark:bg-transparent'
                      }`}
                    >
                      <Dislike
                        className={`cursor-pointer ${
                          isDislikeClicked || feedback === 'DISLIKE'
                            ? 'fill-white-3000 stroke-red-2000 dark:fill-transparent'
                            : 'fill-none stroke-gray-4000'
                        }`}
                        onClick={() => {
                          if (feedback === undefined || feedback === null) {
                            handleFeedback?.('DISLIKE');
                            setIsDislikeClicked(true);
                            setIsLikeClicked(false);
                          } else if (feedback === 'DISLIKE') {
                            handleFeedback?.(null);
                            setIsLikeClicked(false);
                            setIsDislikeClicked(false);
                          }
                        }}
                        onMouseEnter={() => setIsDislikeHovered(true)}
                        onMouseLeave={() => setIsDislikeHovered(false)}
                      ></Dislike>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {sources && (
          <Sidebar
            isOpen={isSidebarOpen}
            toggleState={(state: boolean) => {
              setIsSidebarOpen(state);
            }}
          >
            <AllSources sources={sources} />
          </Sidebar>
        )}
      </div>
    );
  }
  return bubble;
});

type AllSourcesProps = {
  sources: { title: string; text: string; link?: string }[];
};

function AllSources(sources: AllSourcesProps) {
  const { t } = useTranslation();

  const handleCardClick = (link: string) => {
    if (link && link !== 'local') {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="h-full w-full">
      <div className="w-full">
        <p className="text-left text-xl">{`${sources.sources.length} ${t('conversation.sources.title')}`}</p>
        <div className="mx-1 mt-2 h-[0.8px] w-full rounded-full bg-[#C4C4C4]/40 lg:w-[95%]"></div>
      </div>
      <div className="mt-6 flex h-[90%] w-60 flex-col items-center gap-4 overflow-y-auto sm:w-80">
        {sources.sources.map((source, index) => {
          const isExternalSource = source.link && source.link !== 'local';
          return (
            <div
              key={index}
              className={`group/card relative w-full rounded-[20px] bg-gray-1000 p-4 transition-colors hover:bg-[#F1F1F1] dark:bg-[#28292E] dark:hover:bg-[#2C2E3C] ${
                isExternalSource ? 'cursor-pointer' : ''
              }`}
              onClick={() =>
                isExternalSource && source.link && handleCardClick(source.link)
              }
            >
              <p
                title={source.title}
                className={`ellipsis-text break-words text-left text-sm font-semibold ${
                  isExternalSource
                    ? 'group-hover/card:text-purple-30 dark:group-hover/card:text-[#8C67D7]'
                    : ''
                }`}
              >
                {`${index + 1}. ${source.title}`}
                {isExternalSource && (
                  <img
                    src={Link}
                    alt="External Link"
                    className={`ml-1 inline h-3 w-3 object-fill dark:invert ${
                      isExternalSource
                        ? 'group-hover/card:contrast-[50%] group-hover/card:hue-rotate-[235deg] group-hover/card:invert-[31%] group-hover/card:saturate-[752%] group-hover/card:sepia-[80%] group-hover/card:filter'
                        : ''
                    }`}
                  />
                )}
              </p>
              <p className="mt-3 line-clamp-4 break-words rounded-md text-left text-xs text-black dark:text-chinese-silver">
                {source.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default ConversationBubble;

function ToolCalls({ toolCalls }: { toolCalls: ToolCallsType[] }) {
  const [isToolCallsOpen, setIsToolCallsOpen] = useState(false);
  return (
    <div className="mb-4 flex w-full flex-col flex-wrap items-start self-start lg:flex-nowrap">
      <div className="my-2 flex flex-row items-center justify-center gap-3">
        <Avatar
          className="h-[26px] w-[30px] text-xl"
          avatar={
            <img
              src={Sources}
              alt={'ToolCalls'}
              className="h-full w-full object-fill"
            />
          }
        />
        <button
          className="flex flex-row items-center gap-2"
          onClick={() => setIsToolCallsOpen(!isToolCallsOpen)}
        >
          <p className="text-base font-semibold">Tool Calls</p>
          <img
            src={ChevronDown}
            alt="ChevronDown"
            className={`h-4 w-4 transform transition-transform duration-200 dark:invert ${isToolCallsOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      {isToolCallsOpen && (
        <div className="fade-in ml-3 mr-5 w-[90vw] md:w-[70vw] lg:w-full">
          <div className="grid grid-cols-1 gap-2">
            {toolCalls.map((toolCall, index) => (
              <Accordion
                key={`tool-call-${index}`}
                title={`${toolCall.tool_name}  -  ${toolCall.action_name.substring(0, toolCall.action_name.lastIndexOf('_'))}`}
                className="w-full rounded-[20px] bg-gray-1000 hover:bg-[#F1F1F1] dark:bg-gun-metal dark:hover:bg-[#2C2E3C]"
                titleClassName="px-6 py-2 text-sm font-semibold"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col rounded-2xl border border-silver dark:border-silver/20">
                    <p className="flex flex-row items-center justify-between break-words rounded-t-2xl bg-black/10 px-2 py-1 text-sm font-semibold dark:bg-[#191919]">
                      <span style={{ fontFamily: 'IBMPlexMono-Medium' }}>
                        Arguments
                      </span>{' '}
                      <CopyButton
                        textToCopy={JSON.stringify(toolCall.arguments, null, 2)}
                      />
                    </p>
                    <p className="dark:tex break-words rounded-b-2xl p-2 font-mono text-sm dark:bg-[#222327]">
                      <span
                        className="leading-[23px] text-black dark:text-gray-400"
                        style={{ fontFamily: 'IBMPlexMono-Medium' }}
                      >
                        {JSON.stringify(toolCall.arguments, null, 2)}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col rounded-2xl border border-silver dark:border-silver/20">
                    <p className="flex flex-row items-center justify-between break-words rounded-t-2xl bg-black/10 px-2 py-1 text-sm font-semibold dark:bg-[#191919]">
                      <span style={{ fontFamily: 'IBMPlexMono-Medium' }}>
                        Response
                      </span>{' '}
                      <CopyButton
                        textToCopy={JSON.stringify(toolCall.result, null, 2)}
                      />
                    </p>
                    {toolCall.status === 'pending' && (
                      <span className="flex w-full items-center justify-center rounded-b-2xl p-2 dark:bg-[#222327]">
                        <Spinner size="small" />
                      </span>
                    )}
                    {toolCall.status === 'completed' && (
                      <p className="break-words rounded-b-2xl p-2 font-mono text-sm dark:bg-[#222327]">
                        <span
                          className="leading-[23px] text-black dark:text-gray-400"
                          style={{ fontFamily: 'IBMPlexMono-Medium' }}
                        >
                          {JSON.stringify(toolCall.result, null, 2)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </Accordion>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Thought({
  thought,
  preprocessLaTeX,
}: {
  thought: string;
  preprocessLaTeX: (content: string) => string;
}) {
  const [isDarkTheme] = useDarkTheme();
  const [isThoughtOpen, setIsThoughtOpen] = useState(true);

  return (
    <div className="mb-4 flex w-full flex-col flex-wrap items-start self-start lg:flex-nowrap">
      <div className="my-2 flex flex-row items-center justify-center gap-3">
        <Avatar
          className="h-[26px] w-[30px] text-xl"
          avatar={
            <img
              src={Cloud}
              alt={'Thought'}
              className="h-full w-full object-fill"
            />
          }
        />
        <button
          className="flex flex-row items-center gap-2"
          onClick={() => setIsThoughtOpen(!isThoughtOpen)}
        >
          <p className="text-base font-semibold">Reasoning</p>
          <img
            src={ChevronDown}
            alt="ChevronDown"
            className={`h-4 w-4 transform transition-transform duration-200 dark:invert ${isThoughtOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      {isThoughtOpen && (
        <div className="fade-in ml-2 mr-5 max-w-[90vw] md:max-w-[70vw] lg:max-w-[50vw]">
          <div className="rounded-[28px] bg-gray-1000 px-7 py-[18px] dark:bg-gun-metal">
            <ReactMarkdown
              className="fade-in whitespace-pre-wrap break-words leading-normal"
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code(props) {
                  const { children, className, node, ref, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';

                  return match ? (
                    <div className="group relative overflow-hidden rounded-[14px] border border-light-silver dark:border-raisin-black">
                      <div className="flex items-center justify-between bg-platinum px-2 py-1 dark:bg-eerie-black-2">
                        <span className="text-xs font-medium text-just-black dark:text-chinese-white">
                          {language}
                        </span>
                        <CopyButton
                          textToCopy={String(children).replace(/\n$/, '')}
                        />
                      </div>
                      <SyntaxHighlighter
                        {...rest}
                        PreTag="div"
                        language={language}
                        style={isDarkTheme ? vscDarkPlus : oneLight}
                        className="!mt-0"
                        customStyle={{
                          margin: 0,
                          borderRadius: 0,
                          scrollbarWidth: 'thin',
                        }}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="whitespace-pre-line rounded-[6px] bg-gray-200 px-[8px] py-[4px] text-xs font-normal dark:bg-independence dark:text-bright-gray">
                      {children}
                    </code>
                  );
                },
                ul({ children }) {
                  return (
                    <ul className="list-inside list-disc whitespace-normal pl-4">
                      {children}
                    </ul>
                  );
                },
                ol({ children }) {
                  return (
                    <ol className="list-inside list-decimal whitespace-normal pl-4">
                      {children}
                    </ol>
                  );
                },
                table({ children }) {
                  return (
                    <div className="relative overflow-x-auto rounded-lg border border-silver/40 dark:border-silver/40">
                      <table className="w-full text-left text-gray-700 dark:text-bright-gray">
                        {children}
                      </table>
                    </div>
                  );
                },
                thead({ children }) {
                  return (
                    <thead className="bg-gray-50 text-xs uppercase text-gray-900 dark:bg-[#26272E]/50 dark:text-bright-gray">
                      {children}
                    </thead>
                  );
                },
                tr({ children }) {
                  return (
                    <tr className="border-b border-gray-200 odd:bg-white even:bg-gray-50 dark:border-silver/40 dark:odd:bg-[#26272E] dark:even:bg-[#26272E]/50">
                      {children}
                    </tr>
                  );
                },
                th({ children }) {
                  return <th className="px-6 py-3">{children}</th>;
                },
                td({ children }) {
                  return <td className="px-6 py-3">{children}</td>;
                },
              }}
            >
              {preprocessLaTeX(thought ?? '')}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
