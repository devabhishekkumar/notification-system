from abc import ABC, abstractmethod


class NotificationProvider(ABC):
    """
    Base interface for all notification providers.
    """

    @abstractmethod
    def send(
        self,
        recipient: str,
        title: str = "",
        subject: str = "",
        body: str = "",
    ) -> dict:
        """
        Send a notification.

        Returns:
            {
                "success": bool,
                "provider_message_id": str | None,
                "error": str | None,
            }
        """
        raise NotImplementedError
