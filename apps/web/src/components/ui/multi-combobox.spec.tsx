import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiCombobox, type MultiComboboxOption } from './multi-combobox';

const options: readonly MultiComboboxOption[] = [
  { label: 'Financeiro', value: 'financeiro' },
  { label: 'Jurídico', value: 'juridico' },
  { label: 'Recursos Humanos', value: 'rh' },
];

describe('MultiCombobox', () => {
  it('should render the placeholder when values is empty', () => {
    render(
      <MultiCombobox
        values={[]}
        onValuesChange={jest.fn()}
        options={options}
        placeholder="Selecionar departamentos"
      />,
    );

    expect(screen.getByText('Selecionar departamentos')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should open the popover and show all options when the trigger is clicked', () => {
    render(<MultiCombobox values={[]} onValuesChange={jest.fn()} options={options} />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Financeiro' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Jurídico' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Recursos Humanos' })).toBeInTheDocument();
  });

  it('should filter the visible options by label, case-insensitively, when typing in the search', () => {
    render(<MultiCombobox values={[]} onValuesChange={jest.fn()} options={options} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByPlaceholderText('Buscar…'), { target: { value: 'jUR' } });

    expect(screen.getByRole('option', { name: 'Jurídico' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Financeiro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Recursos Humanos' })).not.toBeInTheDocument();
  });

  it('should add an unselected option to values and keep the popover open when clicked', () => {
    const onValuesChange = jest.fn();
    render(<MultiCombobox values={[]} onValuesChange={onValuesChange} options={options} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('option', { name: 'Financeiro' }));

    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalledWith(['financeiro']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should remove an already-selected option from values when clicked', () => {
    const onValuesChange = jest.fn();
    render(
      <MultiCombobox
        values={['financeiro', 'juridico']}
        onValuesChange={onValuesChange}
        options={options}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('option', { name: 'Financeiro' }));

    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalledWith(['juridico']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should close the popover when clicking outside', () => {
    render(<MultiCombobox values={[]} onValuesChange={jest.fn()} options={options} />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should not open the popover when disabled', () => {
    render(<MultiCombobox values={[]} onValuesChange={jest.fn()} options={options} disabled />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should apply its own truncation classes to each trigger chip so a long label clips with an ellipsis instead of being cut off by the container', () => {
    // Rótulos PT-BR realistas e longos (Tasks 10/11 vão alimentar este
    // componente com nomes de departamento/usuário como estes) — o chip
    // precisa truncar com sua própria reticência, não ser cortado pelo
    // overflow-hidden do container ancestral no meio do pill.
    const longLabelOptions: readonly MultiComboboxOption[] = [
      { label: 'Tecnologia da Informação e Comunicação', value: 'ti' },
      { label: 'Recursos Humanos', value: 'rh' },
    ];

    render(
      <MultiCombobox
        values={['ti', 'rh']}
        onValuesChange={jest.fn()}
        options={longLabelOptions}
      />,
    );

    const chip = screen.getByText('Tecnologia da Informação e Comunicação');
    expect(chip.className).toEqual(expect.stringContaining('truncate'));
    expect(chip.className).toEqual(expect.stringContaining('min-w-0'));
    // shrink (não shrink-0): o chip precisa poder encolher para caber no
    // espaço disponível quando os chips somados excedem a largura do campo.
    expect(chip.className).toMatch(/(?:^|\s)shrink(?!-0)(?:\s|$)/);
  });
});
