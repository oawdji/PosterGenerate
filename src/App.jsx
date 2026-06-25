import { Crosshair, Download, Image, Loader2, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { apiClient as defaultApiClient } from './api.js';
import './styles.css';

const emptyCopy = {
  title: '',
  subtitle: '',
  sellingPoints: ['', '', ''],
  callToAction: '',
  visualStyle: '',
  imagePrompt: '',
};

const templates = [
  { value: 'commercial', label: '商业促销' },
  { value: 'event', label: '活动邀请' },
  { value: 'brand', label: '品牌宣传' },
  { value: 'holiday', label: '节日营销' },
];

function normalizeCopyFields(copy) {
  return {
    ...emptyCopy,
    ...copy,
    sellingPoints: Array.isArray(copy?.sellingPoints)
      ? [...copy.sellingPoints, '', '', ''].slice(0, 3)
      : emptyCopy.sellingPoints,
  };
}

export function PosterTool({ apiClient = defaultApiClient }) {
  const [requirement, setRequirement] = useState('');
  const [template, setTemplate] = useState('commercial');
  const [copy, setCopy] = useState(emptyCopy);
  const [posterImage, setPosterImage] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [selection, setSelection] = useState(null);
  const [error, setError] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);
  const [posterLoading, setPosterLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const hasCopy = useMemo(
    () =>
      Boolean(
        copy.title ||
          copy.subtitle ||
          copy.callToAction ||
          copy.visualStyle ||
          copy.imagePrompt ||
          copy.sellingPoints.some(Boolean),
      ),
    [copy],
  );

  async function handleGenerateCopy() {
    setError('');
    setCopyLoading(true);
    setPosterImage('');
    setSelection(null);
    setEditInstruction('');

    try {
      const result = await apiClient.generateCopy({ requirement, template });
      setCopy(normalizeCopyFields(result.copy));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCopyLoading(false);
    }
  }

  async function handleGeneratePoster() {
    setError('');
    setPosterLoading(true);

    try {
      const result = await apiClient.generatePoster({ copy, template });
      setPosterImage(result.image);
      setSelection(null);
      setEditInstruction('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPosterLoading(false);
    }
  }

  async function handleEditPoster() {
    if (!posterImage || !selection || !editInstruction.trim()) {
      return;
    }

    setError('');
    setEditLoading(true);

    try {
      const result = await apiClient.editPoster({
        copy,
        template,
        selection,
        instruction: editInstruction.trim(),
      });
      setPosterImage(result.image);
      setEditInstruction('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setEditLoading(false);
    }
  }

  function updateCopyField(field, value) {
    setCopy((current) => ({ ...current, [field]: value }));
  }

  function updateSellingPoint(index, value) {
    setCopy((current) => ({
      ...current,
      sellingPoints: current.sellingPoints.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  }

  function handlePosterClick(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    setSelection({
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
    });
  }

  function formatSelectionPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="control-panel">
          <header className="app-header">
            <div className="mark">
              <Sparkles size={22} aria-hidden="true" />
            </div>
            <h1>AI 海报绘制工具</h1>
          </header>

          <div className="field-stack">
            <label htmlFor="requirement">海报需求</label>
            <textarea
              id="requirement"
              value={requirement}
              onChange={(event) => setRequirement(event.target.value)}
              rows={5}
              placeholder="例如：给咖啡店做一张周末新品促销海报，风格温暖高级"
            />
          </div>

          <div className="field-stack">
            <label htmlFor="template">视觉模板</label>
            <select id="template" value={template} onChange={(event) => setTemplate(event.target.value)}>
              {templates.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button className="primary-button" type="button" onClick={handleGenerateCopy} disabled={copyLoading || posterLoading}>
            {copyLoading ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
            生成文案
          </button>

          {error ? <div className="error-message">{error}</div> : null}

          <section className="copy-panel" aria-label="AI 文案">
            <div className="panel-title">AI 文案</div>
            <div className="field-grid">
              <label>
                标题
                <input value={copy.title} onChange={(event) => updateCopyField('title', event.target.value)} />
              </label>
              <label>
                副标题
                <input value={copy.subtitle} onChange={(event) => updateCopyField('subtitle', event.target.value)} />
              </label>
              {copy.sellingPoints.map((point, index) => (
                <label key={index}>
                  卖点 {index + 1}
                  <input value={point} onChange={(event) => updateSellingPoint(index, event.target.value)} />
                </label>
              ))}
              <label>
                行动语
                <input value={copy.callToAction} onChange={(event) => updateCopyField('callToAction', event.target.value)} />
              </label>
              <label>
                视觉风格
                <input value={copy.visualStyle} onChange={(event) => updateCopyField('visualStyle', event.target.value)} />
              </label>
              <label className="wide-field">
                图片提示词
                <textarea
                  value={copy.imagePrompt}
                  rows={4}
                  onChange={(event) => updateCopyField('imagePrompt', event.target.value)}
                />
              </label>
            </div>
          </section>

          <button className="secondary-button" type="button" onClick={handleGeneratePoster} disabled={!hasCopy || copyLoading || posterLoading}>
            {posterLoading ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <Image size={18} aria-hidden="true" />}
            生成海报
          </button>
        </div>

        <section className="poster-panel" aria-label="海报预览">
          {posterImage ? (
            <>
              <div className="poster-editor">
                <img className="poster-image" src={posterImage} alt="生成的海报" onClick={handlePosterClick} />
                {selection ? (
                  <span
                    className="selection-marker"
                    style={{ left: `${selection.x * 100}%`, top: `${selection.y * 100}%` }}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <section className="local-edit-panel" aria-label="局部修改">
                <div className="local-edit-title">
                  <Crosshair size={18} aria-hidden="true" />
                  {selection
                    ? `选中位置：${formatSelectionPercent(selection.x)}, ${formatSelectionPercent(selection.y)}`
                    : '点击海报选择修改位置'}
                </div>
                <label>
                  局部修改要求
                  <textarea
                    value={editInstruction}
                    rows={3}
                    onChange={(event) => setEditInstruction(event.target.value)}
                    placeholder="例如：把这里改成红色按钮"
                  />
                </label>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={handleEditPoster}
                  disabled={!selection || !editInstruction.trim() || copyLoading || posterLoading || editLoading}
                >
                  {editLoading ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
                  局部修改
                </button>
              </section>
              <a className="download-button" href={posterImage} download="ai-poster.png">
                <Download size={18} aria-hidden="true" />
                下载海报
              </a>
            </>
          ) : (
            <div className="empty-preview">
              <Image size={42} aria-hidden="true" />
              <p>{posterLoading ? '海报生成中' : '最终海报会显示在这里'}</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default function App() {
  return <PosterTool />;
}
