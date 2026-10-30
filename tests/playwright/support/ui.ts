import { expect, type Locator, type Page } from '@playwright/test';

export function repoCard(page: Page, alias: string): Locator {
  return page
    .locator('div')
    .filter({ has: page.getByText(alias, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Edit repository', includeHidden: true }) })
    .last();
}

export function toast(page: Page, text: string | RegExp): Locator {
  return page.locator('.Toastify').getByText(text);
}

export function userMenu(page: Page): Locator {
  return page.locator('header button[aria-expanded]');
}

// react-select renders a hidden input; the control is the label's next sibling.
export async function pickSelectOption(page: Page, control: Locator, option: string) {
  await control.click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

export async function searchRepos(page: Page, query: string) {
  const search = page.getByPlaceholder('Alias, comment, repository name...');
  await search.fill(query);
  await expect(search).toHaveValue(query);
}

export async function openRepoEdit(page: Page, alias: string) {
  await page.goto('/');
  await searchRepos(page, alias);
  await repoCard(page, alias).getByRole('button', { name: 'Edit repository' }).click();
  await expect(page.getByRole('heading', { name: /Edit the repository/ })).toBeVisible();
}

// better-auth rate limits sign-in, which a fast suite can hit: retry until the
// redirect happens.
export async function uiSignIn(page: Page, username: string, password: string) {
  await expect(async () => {
    await page.goto('/login');
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 5_000 });
  }).toPass({ intervals: [5_000, 10_000], timeout: 60_000 });
}
