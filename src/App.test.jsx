import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PosterTool } from './App.jsx';

const copy = {
  title: '周末新品上市',
  subtitle: '咖啡与甜点限时组合',
  sellingPoints: ['精品咖啡', '手作甜点', '周末限定'],
  callToAction: '立即到店尝鲜',
  visualStyle: 'warm premium coffee poster',
  imagePrompt: 'A complete warm coffee promotion poster',
};

describe('PosterTool', () => {
  it('generates editable copy from a user requirement', async () => {
    const user = userEvent.setup();
    const apiClient = {
      generateCopy: async () => ({ copy }),
      generatePoster: async () => ({ image: 'data:image/png;base64,aW1hZ2U=' }),
    };

    render(<PosterTool apiClient={apiClient} />);

    await user.type(screen.getByLabelText('海报需求'), '咖啡店周末促销');
    await user.selectOptions(screen.getByLabelText('视觉模板'), 'event');
    await user.click(screen.getByRole('button', { name: '生成文案' }));

    expect(await screen.findByDisplayValue('周末新品上市')).toBeInTheDocument();
    expect(screen.getByDisplayValue('立即到店尝鲜')).toBeInTheDocument();
  });

  it('generates and displays the final poster image', async () => {
    const user = userEvent.setup();
    const apiClient = {
      generateCopy: async () => ({ copy }),
      generatePoster: async () => ({ image: 'data:image/png;base64,aW1hZ2U=' }),
    };

    render(<PosterTool apiClient={apiClient} />);

    await user.type(screen.getByLabelText('海报需求'), '咖啡店周末促销');
    await user.click(screen.getByRole('button', { name: '生成文案' }));
    await screen.findByDisplayValue('周末新品上市');
    await user.click(screen.getByRole('button', { name: '生成海报' }));

    const image = await screen.findByAltText('生成的海报');
    expect(image).toHaveAttribute('src', 'data:image/png;base64,aW1hZ2U=');
    expect(screen.getByRole('link', { name: '下载海报' })).toHaveAttribute('href', 'data:image/png;base64,aW1hZ2U=');
  });

  it('submits a local poster edit for the clicked point', async () => {
    const user = userEvent.setup();
    const editCalls = [];
    const apiClient = {
      generateCopy: async () => ({ copy }),
      generatePoster: async () => ({ image: 'data:image/png;base64,b3JpZ2luYWw=' }),
      editPoster: async (payload) => {
        editCalls.push(payload);
        return { image: 'data:image/png;base64,ZWRpdGVk' };
      },
    };

    render(<PosterTool apiClient={apiClient} />);

    await user.click(screen.getByRole('button', { name: '生成文案' }));
    await screen.findByDisplayValue('周末新品上市');
    await user.click(screen.getByRole('button', { name: '生成海报' }));

    const image = await screen.findByAltText('生成的海报');
    image.getBoundingClientRect = () => ({
      left: 10,
      top: 20,
      width: 200,
      height: 400,
      right: 210,
      bottom: 420,
      x: 10,
      y: 20,
      toJSON: () => {},
    });
    fireEvent.click(image, { clientX: 60, clientY: 120 });

    expect(screen.getByText('选中位置：25%, 25%')).toBeInTheDocument();

    await user.type(screen.getByLabelText('局部修改要求'), '把这里改成红色按钮');
    await user.click(screen.getByRole('button', { name: '局部修改' }));

    expect(editCalls).toHaveLength(1);
    expect(editCalls[0]).toMatchObject({
      copy,
      template: 'commercial',
      selection: { x: 0.25, y: 0.25 },
      instruction: '把这里改成红色按钮',
    });
    expect(editCalls[0]).not.toHaveProperty('image');
    expect(await screen.findByAltText('生成的海报')).toHaveAttribute('src', 'data:image/png;base64,ZWRpdGVk');
  });

  it('keeps the user requirement visible when copy generation fails', async () => {
    const user = userEvent.setup();
    const apiClient = {
      generateCopy: async () => {
        throw new Error('Copy generation failed. Please try again.');
      },
      generatePoster: async () => ({ image: 'unused' }),
    };

    render(<PosterTool apiClient={apiClient} />);

    await user.type(screen.getByLabelText('海报需求'), '咖啡店周末促销');
    await user.click(screen.getByRole('button', { name: '生成文案' }));

    expect(await screen.findByText('Copy generation failed. Please try again.')).toBeInTheDocument();
    expect(screen.getByLabelText('海报需求')).toHaveValue('咖啡店周末促销');
  });
});
