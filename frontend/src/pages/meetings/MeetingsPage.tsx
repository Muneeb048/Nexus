import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, startOfHour } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { meetingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { User } from '../../types';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Meeting {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: string;
  callRoomId: string;
  organizerId: User;
  attendeeId: User;
}

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New meeting state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState(startOfHour(new Date()));
  const [newEndTime, setNewEndTime] = useState(addHours(startOfHour(new Date()), 1));
  const [newAttendeeId, setNewAttendeeId] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await meetingsAPI.getMeetings();
      setMeetings(response.data.meetings);
    } catch (error) {
      toast.error('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setNewStartTime(start);
    setNewEndTime(end);
    setShowModal(true);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await meetingsAPI.createMeeting({
        title: newTitle,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
        attendeeId: newAttendeeId
      });
      toast.success('Meeting scheduled successfully');
      setShowModal(false);
      setNewTitle('');
      fetchMeetings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to schedule meeting');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await meetingsAPI.updateStatus(id, status);
      toast.success(`Meeting ${status}`);
      fetchMeetings();
    } catch (error: any) {
      toast.error('Failed to update meeting status');
    }
  };

  const joinCall = (roomId: string) => {
    // Navigate to call room
    window.open(`/call/${roomId}`, '_blank');
  };

  const events = meetings.map(meeting => ({
    id: meeting._id,
    title: meeting.title + ` (${meeting.status})`,
    start: new Date(meeting.startTime),
    end: new Date(meeting.endTime),
    resource: meeting
  }));

  const eventStyleGetter = (event: any) => {
    const meeting = event.resource as Meeting;
    let backgroundColor = '#3182ce'; // Default blue
    
    if (meeting.status === 'pending') {
      backgroundColor = '#ed8936'; // Orange
    } else if (meeting.status === 'rejected' || meeting.status === 'cancelled') {
      backgroundColor = '#e53e3e'; // Red
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage your video calls</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          Schedule Meeting
        </Button>
      </div>

      <Card className="flex-1 flex flex-col min-h-[600px]">
        <CardBody className="flex-1 h-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">Loading...</div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%', minHeight: 500 }}
              selectable
              onSelectSlot={handleSelectSlot}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={(event) => {
                const m = event.resource as Meeting;
                const isAttendee = m.attendeeId._id === user?.id || (m.attendeeId as any).id === user?.id;
                
                // Very basic action prompt for demo purposes
                if (m.status === 'pending' && isAttendee) {
                  if (window.confirm(`Accept meeting: ${m.title}?`)) {
                    handleUpdateStatus(m._id, 'accepted');
                  } else {
                    handleUpdateStatus(m._id, 'rejected');
                  }
                } else if (m.status === 'accepted') {
                   if (window.confirm(`Join video call for: ${m.title}?`)) {
                     joinCall(m.callRoomId);
                   }
                }
              }}
            />
          )}
        </CardBody>
      </Card>

      {/* Basic Scheduling Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Schedule Meeting</h2>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={format(newStartTime, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setNewStartTime(new Date(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={format(newEndTime, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setNewEndTime(new Date(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Attendee ID (User ID)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Paste User ID here..."
                  value={newAttendeeId}
                  onChange={(e) => setNewAttendeeId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                />
                <p className="text-xs text-gray-500 mt-1">Note: In a real app, this would be a user search dropdown.</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
