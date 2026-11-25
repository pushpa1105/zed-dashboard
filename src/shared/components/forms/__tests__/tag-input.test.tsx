import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { MultiSelect } from '../multi-select';
import { TagInput } from '../tag-input';

function ControlledTags(props: Partial<React.ComponentProps<typeof TagInput>>) {
  const [tags, setTags] = useState<string[]>(['alpha']);
  return (
    <>
      <TagInput aria-label="tags" placeholder="Add" {...props} value={tags} onChange={setTags} />
      <output data-testid="value">{tags.join('|')}</output>
    </>
  );
}

const value = () => screen.getByTestId('value').textContent;

describe('TagInput', () => {
  it('adds on Enter and comma, ignores duplicates, removes with Backspace', async () => {
    const user = userEvent.setup();
    render(<ControlledTags />);
    const input = screen.getByPlaceholderText('Add');

    await user.type(input, 'beta{Enter}gamma,');
    expect(value()).toBe('alpha|beta|gamma');

    await user.type(input, 'beta{Enter}');
    expect(value()).toBe('alpha|beta|gamma');
    expect(screen.getByRole('alert')).toHaveTextContent('already added');

    await user.type(input, '{Backspace}');
    expect(value()).toBe('alpha|beta');
  });

  it('splits pasted text, validates and respects max', async () => {
    const user = userEvent.setup();
    render(
      <ControlledTags
        max={3}
        validate={(tag) => (tag.includes('@') ? undefined : `${tag} is not an email`)}
      />,
    );
    const input = screen.getByPlaceholderText('Add');
    await user.click(input);
    await user.paste('a@x.io, nope; b@x.io, c@x.io');

    // "alpha" was preset; only two valid emails fit under max=3.
    expect(value()).toBe('alpha|a@x.io|b@x.io');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('removes a tag with its button', async () => {
    const user = userEvent.setup();
    render(<ControlledTags />);
    await user.click(screen.getByRole('button', { name: 'Remove alpha' }));
    expect(value()).toBe('');
  });
});

describe('MultiSelect', () => {
  const options = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
    { value: 'c', label: 'Cherry', disabled: true },
  ];

  it('toggles options, selects all enabled ones and clears', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelect options={options} onChange={onChange} selectAll placeholder="Pick fruit" />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: /banana/i }));
    expect(onChange).toHaveBeenLastCalledWith(['b']);

    await user.click(screen.getByRole('option', { name: /select all/i }));
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /clear selection/i }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
