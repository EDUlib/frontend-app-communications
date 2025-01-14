/**
 * @jest-environment jsdom
 */
import React from 'react';
import {
  render, screen, fireEvent, cleanup, act,
} from '../../../../setupTest';
import BulkEmailContentHistory from '../BulkEmailContentHistory';
import { getSentEmailHistory } from '../data/api';
import buildEmailContentHistoryData from '../data/__factories__/emailContentHistory.factory';

jest.mock('../data/api', () => ({
  __esModule: true,
  getSentEmailHistory: jest.fn(() => {}),
}));

describe('BulkEmailContentHistory component', () => {
  beforeEach(() => jest.resetModules());
  afterEach(cleanup);

  test('renders correctly', async () => {
    render(<BulkEmailContentHistory copyTextToEditor={jest.fn()} />);
    const tableDescription = await screen.findByText(
      'To see the content of previously sent emails, click this button:',
    );
    expect(tableDescription).toBeTruthy();
    const showEmailContentHistoryButton = await screen.findByText('Show Sent Email History');
    expect(showEmailContentHistoryButton).toBeTruthy();
  });

  test('renders a table when the button is pressed and data is returned', async () => {
    await act(async () => {
      const emailHistoryData = buildEmailContentHistoryData(1);
      getSentEmailHistory.mockImplementation(() => emailHistoryData);

      render(<BulkEmailContentHistory copyTextToEditor={jest.fn()} />);

      const showEmailContentHistoryButton = await screen.findByText('Show Sent Email History');
      fireEvent.click(showEmailContentHistoryButton);

      // verify component structure
      const tableDescription = await screen.findByText(
        'To read a sent email message, click the `View Message` button within the table.',
      );
      expect(tableDescription).toBeTruthy();

      // verify table structure
      expect(await screen.findByText('Subject')).toBeTruthy();
      expect(await screen.findByText('Sent By')).toBeTruthy();
      expect(await screen.findByText('Sent To')).toBeTruthy();
      expect(await screen.findByText('Time Sent')).toBeTruthy();
      expect(await screen.findByText('Number Sent')).toBeTruthy();

      // verify table contents
      const { emails } = emailHistoryData;
      const email = emails[0];
      expect(await screen.findByText(email.created)).toBeTruthy();
      expect(await screen.findByText(email.number_sent)).toBeTruthy();
      expect(await screen.findByText(email.requester)).toBeTruthy();
      expect(await screen.findByText(email.sent_to.join(', '))).toBeTruthy();
      expect(await screen.findByText(email.email.subject)).toBeTruthy();
      expect(await screen.findAllByText('View Message')).toBeTruthy();
    });
  });

  test('renders a modal that will display the contents of the previously sent message to a user', async () => {
    await act(async () => {
      const emailHistoryData = buildEmailContentHistoryData(1);
      getSentEmailHistory.mockImplementation(() => emailHistoryData);

      render(<BulkEmailContentHistory copyTextToEditor={jest.fn()} />);

      const showEmailContentHistoryButton = await screen.findByText('Show Sent Email History');
      fireEvent.click(showEmailContentHistoryButton);

      const viewMessageButton = await screen.findByText('View Message');
      fireEvent.click(viewMessageButton);

      // verify modal components and behavior
      const { emails } = emailHistoryData;
      const email = emails[0];
      const closeButton = await screen.findAllByText('Close');

      expect(closeButton).toBeTruthy();
      expect(await screen.findByText('Subject:')).toBeTruthy();
      expect(await screen.findByText('Sent by:')).toBeTruthy();
      expect(await screen.findByText('Time sent:')).toBeTruthy();
      expect(await screen.findByText('Sent to:')).toBeTruthy();
      expect(await screen.findByText('Message:')).toBeTruthy();
      expect(await screen.findAllByText(email.email.subject)).toBeTruthy();
      expect(await screen.findAllByText(email.requester)).toBeTruthy();
      expect(await screen.findAllByText(email.created)).toBeTruthy();
      expect(await screen.findAllByText(email.sent_to.join(', '))).toBeTruthy();
      // .replace() call strips the HTML tags from the string
      expect(await screen.findByText(email.email.html_message.replace(/<[^>]*>?/gm, ''))).toBeTruthy();
    });
  });

  test('renders a warning Alert when the button is pressed but there is no data to display', async () => {
    await act(async () => {
      const emailHistoryData = buildEmailContentHistoryData(0);
      getSentEmailHistory.mockImplementation(() => emailHistoryData);
      // render the component
      render(<BulkEmailContentHistory copyTextToEditor={jest.fn()} />);
      // press the `show sent email history` button to initiate data retrieval
      const showEmailContentHistoryButton = await screen.findByText('Show Sent Email History');
      fireEvent.click(showEmailContentHistoryButton);
      // verify that an alert is displayed since the array of tasks is empty
      const alertMessage = await screen.findByText('There is no email history for this course.');
      expect(alertMessage).toBeTruthy();
    });
  });

  test('renders an error Alert when the button is pressed and an error occurs retrieving data', async () => {
    await act(async () => {
      getSentEmailHistory.mockImplementation(() => {
        throw new Error();
      });
      // render the component
      render(<BulkEmailContentHistory copyTextToEditor={jest.fn()} />);
      // press the `show sent email history` button to initiate data retrieval
      const showEmailContentHistoryButton = await screen.findByText('Show Sent Email History');
      fireEvent.click(showEmailContentHistoryButton);
      // verify that an alert is displayed since the array of tasks is empty
      const alertMessage = await screen.findByText(
        'An error occurred retrieving email history data for this course. Please try again later.',
      );
      expect(alertMessage).toBeTruthy();
    });
  });
});
