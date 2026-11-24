import { expect, test, type Page } from '@playwright/test';

function trackConsoleAndPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`console.error: ${msg.text()}`);
    }
  });
  return errors;
}

test.describe('devaware-os Desktop E2E (1440x900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('lock screen transitions cleanly into desktop, loads NSW then WA deals side-by-side, syncs CutSheet -> Feaso RLV with toast, and handles focus/blur/minimize OS_RENDER_STATE', async ({
    page,
  }) => {
    const errors = trackConsoleAndPageErrors(page);

    await page.goto('/');

    // 1. Lock Screen verification & smooth transition
    const lockScreen = page.getByTestId('lock-screen');
    await expect(lockScreen).toBeVisible();
    await expect(page.getByTestId('lock-screen-status-pill')).toContainText(
      'Australia-Wide Open-Source Dev Suite • Metric / GDA2020',
    );
    await expect(page.getByTestId('lock-screen-clock')).toBeVisible();

    await page.getByTestId('enter-workspace-btn').click();
    await expect(page.getByTestId('desktop-workspace')).toBeVisible();
    await expect(lockScreen).toBeHidden();

    // 2. Open File Explorer and double-click NSW/Western-Sydney.deal
    await page.getByTestId('desktop-icon-file-explorer').dblclick();
    await expect(page.getByTestId('file-explorer-app')).toBeVisible();

    await page.getByTestId('deal-row-nsw-western-sydney').dblclick();

    const cutsheetWindow = page.getByTestId('app-window-cutsheet-au');
    const feasoWindow = page.getByTestId('app-window-feaso-os');
    await expect(cutsheetWindow).toBeVisible();
    await expect(feasoWindow).toBeVisible();

    // Verify side-by-side layout (CutSheet left, Feaso right)
    const cutBox = await cutsheetWindow.boundingBox();
    const feasoBox = await feasoWindow.boundingBox();
    expect(cutBox).not.toBeNull();
    expect(feasoBox).not.toBeNull();
    expect(feasoBox!.x).toBeGreaterThan(cutBox!.x + cutBox!.width - 10);

    // Verify NSW & MGA Zone 56 (EPSG:7856) loaded into both iframes
    const cutFrame = page.frameLocator('[data-testid="app-iframe-cutsheet-au"]');
    const feasoFrame = page.frameLocator('[data-testid="app-iframe-feaso-os"]');

    await expect(cutFrame.locator('#site-name')).toContainText(
      'Western Sydney Precinct 14',
    );
    await expect(cutFrame.locator('#site-state')).toHaveText('NSW');
    await expect(cutFrame.locator('#site-epsg')).toContainText('EPSG:7856');
    await expect(cutFrame.locator('#render-loop-badge')).toContainText(
      'Render Loop: ACTIVE',
    );

    await expect(feasoFrame.locator('#feaso-site-name')).toContainText(
      'Western Sydney Precinct 14',
    );
    await expect(feasoFrame.locator('#feaso-state-badge')).toContainText(
      'NSW • MGA Zone 56',
    );
    await expect(feasoFrame.locator('#feaso-mga')).toContainText('EPSG:7856');
    await expect(feasoFrame.locator('#statutory-context')).toContainText(
      'NSW Transfer Duty',
    );

    // 3. Edit Cut Volume & click "Send Earthworks to Feasibility" -> updates RLV + toast
    const initialRlv = await feasoFrame
      .locator('#rlv-value')
      .getAttribute('data-rlv-aud');

    await cutFrame.locator('#cut-volume-input').fill('36000');
    await cutFrame.locator('#cut-volume-input').dispatchEvent('input');
    await cutFrame.locator('#send-earthworks-btn').click();

    // Wait for 200ms debounced PROJECT_PATCH -> OS_PROJECT_SYNC update
    await expect
      .poll(async () => {
        return feasoFrame.locator('#rlv-value').getAttribute('data-rlv-aud');
      })
      .not.toBe(initialRlv);

    const updatedRlv = await feasoFrame
      .locator('#rlv-value')
      .getAttribute('data-rlv-aud');
    expect(Number(updatedRlv)).toBeLessThan(Number(initialRlv));
    await expect(feasoFrame.locator('#feaso-sync-badge')).toContainText(
      'cutsheet-au',
    );

    // Toast notification emitted from CutSheet
    await expect(
      page.getByTestId('toast-notification').filter({
        hasText: 'Earthworks synced to Feasibility',
      }),
    ).toBeVisible();

    // 4. Switch to WA/Perth-North.deal via File Explorer -> verifies WA & Zone 50 (EPSG:7850)
    await page.getByTestId('panel-projects-btn').click();
    await expect(page.getByTestId('file-explorer-app')).toBeVisible();
    await page.getByTestId('folder-WA').click();
    await page.getByTestId('deal-row-wa-perth-north').dblclick();

    await expect(cutFrame.locator('#site-name')).toContainText(
      'Perth North Alkimos Stage 7',
    );
    await expect(cutFrame.locator('#site-state')).toHaveText('WA');
    await expect(cutFrame.locator('#site-epsg')).toContainText('EPSG:7850');

    await expect(feasoFrame.locator('#feaso-site-name')).toContainText(
      'Perth North Alkimos Stage 7',
    );
    await expect(feasoFrame.locator('#feaso-state-badge')).toContainText(
      'WA • MGA Zone 50',
    );
    await expect(feasoFrame.locator('#feaso-mga')).toContainText('EPSG:7850');
    await expect(feasoFrame.locator('#statutory-context')).toContainText(
      'WA Transfer Duty',
    );

    // 5. Clicking unfocused background window (feaso-os) raises it & blurs cutsheet-au -> PAUSED
    const cutZBefore = Number(
      await cutsheetWindow.getAttribute('data-z-index'),
    );
    const feasoZBefore = Number(await feasoWindow.getAttribute('data-z-index'));
    expect(cutZBefore).toBeGreaterThan(feasoZBefore);
    await expect(
      page.getByTestId('unfocused-click-catcher-feaso-os'),
    ).toBeVisible();

    await page.getByTestId('unfocused-click-catcher-feaso-os').click();

    await expect(feasoWindow).toHaveAttribute('data-active', 'true');
    const feasoZAfter = Number(await feasoWindow.getAttribute('data-z-index'));
    expect(feasoZAfter).toBeGreaterThan(cutZBefore);

    // Blurred cutsheet-au must flip OS_RENDER_STATE badge to PAUSED
    await expect(cutFrame.locator('#render-loop-badge')).toContainText(
      'Render Loop: PAUSED',
    );
    await expect(feasoFrame.locator('#feaso-render-badge')).toContainText(
      'Render Loop: ACTIVE',
    );

    // Click unfocused cutsheet-au click-catcher -> raises it back to ACTIVE, then minimize -> PAUSED
    await page.getByTestId('unfocused-click-catcher-cutsheet-au').click();
    await expect(cutFrame.locator('#render-loop-badge')).toContainText(
      'Render Loop: ACTIVE',
    );

    await page.getByTestId('window-minimize-cutsheet-au').click();
    await expect(cutsheetWindow).toHaveAttribute('data-minimized', 'true');
    await expect(cutFrame.locator('#render-loop-badge')).toContainText(
      'Render Loop: PAUSED',
    );

    expect(errors).toEqual([]);
  });

  test('supports ?unlocked=1 auto-skip and App Library 4-repo catalog with pin/unpin', async ({
    page,
  }) => {
    const errors = trackConsoleAndPageErrors(page);

    await page.goto('/?unlocked=1');
    await expect(page.getByTestId('desktop-workspace')).toBeVisible();
    await expect(page.getByTestId('lock-screen')).toHaveCount(0);

    await page.getByTestId('panel-app-library-btn').click();
    await expect(page.getByTestId('app-library-modal')).toBeVisible();
    await expect(page.getByTestId('library-card-cutsheet-au')).toBeVisible();
    await expect(page.getByTestId('library-card-feaso-os')).toBeVisible();
    await expect(page.getByTestId('library-card-formgen-au')).toContainText(
      'Coming Soon',
    );
    await expect(page.getByTestId('library-card-enviro-sim-au')).toContainText(
      'Coming Soon',
    );

    // Pin FormGen AU and confirm desktop icon appears
    await page.getByTestId('library-pin-formgen-au').click();
    await page.getByRole('button', { name: 'Close App Library' }).click();
    await expect(page.getByTestId('desktop-icon-formgen-au')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('Project Inspector shows live SiteProject JSON and visibly logs rejected postMessage origins', async ({
    page,
  }) => {
    const errors = trackConsoleAndPageErrors(page);

    await page.goto('/?unlocked=1');
    await page.getByTestId('desktop-icon-project-inspector').dblclick();
    await expect(page.getByTestId('project-inspector-app')).toBeVisible();
    await expect(page.getByTestId('inspector-json-view')).toContainText(
      'Western Sydney Precinct 14',
    );

    // Dispatch a simulated untrusted postMessage event from an unallowed origin
    await page.evaluate(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'https://untrusted-origin.example.com',
          data: {
            type: 'PROJECT_PATCH',
            patch: { name: 'Hijacked' },
          },
        }),
      );
    });

    await expect(page.getByTestId('inspector-rejected-count')).toContainText(
      '1 blocked',
    );
    await page.getByTestId('inspector-tab-bus').click();
    await expect(page.getByTestId('bus-log-rejected-row')).toContainText(
      'https://untrusted-origin.example.com',
    );
    await expect(page.getByTestId('bus-log-rejected-row')).toContainText(
      'PROJECT_PATCH',
    );

    expect(errors).toEqual([]);
  });
});

test.describe('devaware-os Mobile Responsive Fallback (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('switches automatically below 768px to full-screen tabbed app switcher', async ({
    page,
  }) => {
    const errors = trackConsoleAndPageErrors(page);

    await page.goto('/?unlocked=1');

    await expect(page.getByTestId('mobile-tabbed-shell')).toBeVisible();
    await expect(page.getByTestId('bottom-panel')).toHaveCount(0);

    // Open Projects (AU) from mobile launcher
    await page.getByTestId('mobile-launch-file-explorer').click();
    await expect(page.getByTestId('file-explorer-app')).toBeVisible();
    await expect(page.getByTestId('mobile-tab-file-explorer')).toBeVisible();

    // Open a WA deal -> launches CutSheet AU & Feaso OS tabs
    await page.getByTestId('deal-row-wa-perth-north').dblclick();

    await expect(page.getByTestId('mobile-tab-cutsheet-au')).toBeVisible();
    await expect(page.getByTestId('mobile-tab-feaso-os')).toBeVisible();

    const cutFrame = page.frameLocator('[data-testid="app-iframe-cutsheet-au"]');
    await expect(cutFrame.locator('#site-state')).toHaveText('WA');

    // Switch tab to Feaso OS
    await page.getByTestId('mobile-tab-feaso-os').click();
    const feasoFrame = page.frameLocator('[data-testid="app-iframe-feaso-os"]');
    await expect(feasoFrame.locator('#feaso-state-badge')).toContainText(
      'WA • MGA Zone 50',
    );

    expect(errors).toEqual([]);
  });
});
